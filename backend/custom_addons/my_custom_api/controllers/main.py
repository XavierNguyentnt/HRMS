# -*- coding: utf-8 -*-
import json
import logging

from odoo import http
from odoo.exceptions import UserError, ValidationError
from odoo.http import request, Response

# Tạo một logger riêng cho API controller để dễ dàng debug
_logger = logging.getLogger(__name__)

class MyApiController(http.Controller):

    # --- HÀM HELPER XỬ LÝ LỖI ---
    def _handle_http_error(self, e):
        """Hàm helper để tạo response lỗi 500 cho các endpoint type='http'."""
        _logger.exception("API HTTP Error: %s", str(e))
        error_response = {'error': 'Internal Server Error', 'message': str(e)}
        return Response(json.dumps(error_response), status=500, content_type='application/json')

    # --- CÁC API CÔNG KHAI (PUBLIC) ---
    @http.route('/v1/test', type='http', auth='public', methods=['GET'], cors='*')
    def test_connection(self, **kw):
        """Endpoint công khai để kiểm tra kết nối API."""
        response_data = {'message': 'Hello from your Odoo API!'}
        return Response(json.dumps(response_data), status=200, content_type='application/json')

    # --- CÁC API CẦN XÁC THỰC (USER) ---
    @http.route('/v1/partners', type='http', auth='user', methods=['GET'], cors='*')
    def get_partners(self, **kw):
        """Lấy danh sách 10 đối tác đầu tiên."""
        try:
            fields_to_get = ['id', 'name', 'email', 'phone']
            partners = request.env['res.partner'].search_read(domain=[], fields=fields_to_get, limit=10)
            return Response(json.dumps(partners, default=str), status=200, content_type='application/json')
        except Exception as e:
            return self._handle_http_error(e)

    # --- CRUD CHO MODEL 'PROJECT.TASK' ---

    @http.route('/v1/tasks', type='http', auth='user', methods=['GET'], cors='*')
    def get_tasks(self, **kw):
        """Lấy danh sách tất cả công việc."""
        try:
            fields_to_get = ['id', 'name', 'project_id', 'stage_id', 'date_deadline']
            tasks = request.env['project.task'].search_read([], fields=fields_to_get, limit=80)
            return Response(json.dumps(tasks, default=str), status=200, content_type='application/json')
        except Exception as e:
            return self._handle_http_error(e)

    @http.route('/v1/tasks/<int:task_id>', type='http', auth='user', methods=['GET'], cors='*')
    def get_task_detail(self, task_id, **kw):
        """Lấy thông tin chi tiết của một công việc."""
        try:
            # Dùng search_read với limit=1 là một cách hiệu quả để kiểm tra sự tồn tại và lấy dữ liệu
            task = request.env['project.task'].search_read([('id', '=', task_id)], limit=1)
            if not task:
                return Response(json.dumps({'error': 'Task not found'}), status=404, content_type='application/json')
            return Response(json.dumps(task[0], default=str), status=200, content_type='application/json')
        except Exception as e:
            return self._handle_http_error(e)

    @http.route('/v1/tasks', type='json', auth='user', methods=['POST'], csrf=False)
    def create_task(self, **kw):
        """Tạo một công việc mới."""
        data = request.jsonrequest
        # Validation dữ liệu đầu vào
        if not data.get('name'):
            raise ValidationError("Tên công việc là bắt buộc.")
        
        try:
            # Chỉ lấy các trường được phép để tạo, tăng cường bảo mật
            allowed_fields = ['name', 'project_id', 'user_ids', 'date_deadline', 'description']
            vals = {key: data[key] for key in allowed_fields if key in data}

            # Xử lý riêng cho trường many2many user_ids nếu có
            if 'user_ids' in vals and isinstance(vals['user_ids'], list):
                vals['user_ids'] = [(6, 0, vals['user_ids'])]

            new_task = request.env['project.task'].create(vals)
            # Trả về dữ liệu vừa tạo, Odoo sẽ tự động set status 200 OK
            return new_task.read(['id', 'name', 'project_id', 'stage_id'])[0]
        except (UserError, ValidationError) as e:
            # Bắt các lỗi validation của Odoo và trả về cho client
            request.env.cr.rollback()
            raise UserError(e.name) # Dùng e.name để trả về thông điệp lỗi gọn gàng
        except Exception as e:
            # Bắt các lỗi hệ thống khác
            request.env.cr.rollback()
            _logger.exception("API Error on create_task: %s", str(e))
            # Odoo sẽ tự động chuyển lỗi này thành response JSON 500
            raise UserError("Đã có lỗi không mong muốn xảy ra ở server.")

    @http.route('/v1/tasks/<int:task_id>', type='json', auth='user', methods=['PUT'], csrf=False)
    def update_task(self, task_id, **kw):
        """Cập nhật một công việc đã có."""
        data = request.jsonrequest
        task = request.env['project.task'].browse(task_id)
        if not task.exists():
            # Sử dụng raise UserError để Odoo tự động trả về lỗi 404
            raise UserError('Công việc không tồn tại.')
        
        task.write(data)
        return {'message': 'Công việc {} đã được cập nhật thành công.'.format(task_id)}