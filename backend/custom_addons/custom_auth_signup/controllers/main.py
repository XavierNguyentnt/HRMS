# custom_auth_signup/controllers/main.py
import json
import logging
from odoo import http
from odoo.http import request, Response
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class CustomSignupController(http.Controller):

    @http.route('/api/signup', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def api_signup(self, **kw):
        data = kw.get('params', {})
        name = data.get('name')
        login = data.get('email', '').strip().lower()
        password = data.get('password')

        if not all([name, login, password]):
            # Trả lỗi về cho client nếu thiếu thông tin
            request.env.cr.rollback()
            return {'error': {'code': 400, 'message': 'Bad Request', 'data': {'details': 'Vui lòng điền đầy đủ Họ tên, Email, và Mật khẩu.'}}}

        try:
            # 1. Kiểm tra email đã tồn tại chưa (kể cả inactive)
            if request.env['res.users'].sudo().search([('login', '=', login)]):
                 raise UserError('Email đã tồn tại trong hệ thống.')

            # 2. Kiểm tra whitelist
            whitelist = request.env['registration.whitelist'].sudo().search([('email', '=', login)], limit=1)
            if not whitelist:
                raise UserError('Địa chỉ email này không được phép đăng ký.')
            if whitelist.is_used:
                raise UserError('Địa chỉ email này đã được sử dụng để đăng ký.')
            
            # 3. Chuẩn bị dữ liệu để tạo user
            values = {
                'name': name,
                'login': login,
                'password': password,
                'active': False, # QUAN TRỌNG: Tạo user không hoạt động
            }
            
            # 4. Gọi phương thức tạo user đã được tùy chỉnh
            request.env['res.users'].sudo()._signup_create_user(values)
            
            # Commit transaction nếu thành công
            request.env.cr.commit()

        except UserError as e:
            request.env.cr.rollback()
            return {'error': {'code': 409, 'message': 'Conflict', 'data': {'details': str(e)}}}
        except Exception as e:
            _logger.error("API Signup failed for email %s: %s", login, e)
            request.env.cr.rollback()
            return {'error': {'code': 500, 'message': 'Internal Server Error', 'data': {'details': 'Đã có lỗi xảy ra. Vui lòng thử lại.'}}}

        return {'result': {'success': True, 'message': 'Đăng ký thành công. Vui lòng chờ Quản trị viên phê duyệt.'}}