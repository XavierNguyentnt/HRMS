# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request
from odoo.exceptions import UserError

class DocumentFlowApi(http.Controller):
    """
    API cho module document_flow_ext.
    Cho phép React frontend thao tác với văn bản và luồng xử lý.
    """

    # -------------------------------------------------------------------------
    # 1️⃣ LẤY DANH SÁCH ROUTE CỦA MỘT VĂN BẢN
    # -------------------------------------------------------------------------
    @http.route('/web/api/document/<int:doc_id>/routes', type='json', auth='user', methods=['GET'])
    def get_document_routes(self, doc_id):
        """
        Trả về danh sách các bước xử lý (route) của văn bản.
        """
        document = request.env['dms.file'].sudo().browse(doc_id)
        if not document.exists():
            return {'error': 'Không tìm thấy văn bản'}

        routes = request.env['document.route'].sudo().search_read(
            [('document_id', '=', doc_id)],
            [
                'id', 'sequence', 'from_department_id', 'to_department_id',
                'assigned_to', 'action_type', 'state',
                'date_sent', 'date_received', 'processed_date', 'note'
            ],
            order='sequence asc'
        )

        # Format cho React
        for r in routes:
            if r.get('from_department_id'):
                r['from_department_name'] = r['from_department_id'][1]
                r['from_department_id'] = r['from_department_id'][0]
            if r.get('to_department_id'):
                r['to_department_name'] = r['to_department_id'][1]
                r['to_department_id'] = r['to_department_id'][0]
            if r.get('assigned_to'):
                r['assigned_to_name'] = r['assigned_to'][1]
                r['assigned_to'] = r['assigned_to'][0]

        return {'document_id': doc_id, 'routes': routes}

    # -------------------------------------------------------------------------
    # 2️⃣ GỬI LỆNH “CHUYỂN BƯỚC” (ADVANCE)
    # -------------------------------------------------------------------------
    @http.route('/web/api/document/<int:doc_id>/advance', type='json', auth='user', methods=['POST'])
    def advance_document_route(self, doc_id):
        """
        Chuyển văn bản sang bước tiếp theo trong luồng xử lý.
        """
        try:
            request.env['document.route'].sudo().advance_route(doc_id)
            return {'success': True, 'message': 'Đã chuyển sang bước tiếp theo.'}
        except UserError as e:
            return {'success': False, 'error': str(e)}
        except Exception as e:
            return {'success': False, 'error': f'Lỗi hệ thống: {e}'}

    # -------------------------------------------------------------------------
    # 3️⃣ TẠO MỚI ROUTE CHO VĂN BẢN
    # -------------------------------------------------------------------------
    @http.route('/web/api/document/<int:doc_id>/routes/create', type='json', auth='user', methods=['POST'])
    def create_document_route(self, doc_id, **payload):
        """
        Tạo mới một bước luồng xử lý cho văn bản.
        Dữ liệu gửi từ React dạng JSON:
        {
          "sequence": 10,
          "from_department_id": 1,
          "to_department_id": 2,
          "assigned_to": 5,
          "action_type": "approve",
          "note": "Trình lên phòng giám đốc"
        }
        """
        document = request.env['dms.file'].sudo().browse(doc_id)
        if not document.exists():
            return {'success': False, 'error': 'Không tìm thấy văn bản'}

        try:
            new_route = request.env['document.route'].sudo().create({
                'document_id': doc_id,
                'sequence': payload.get('sequence', 10),
                'from_department_id': payload.get('from_department_id'),
                'to_department_id': payload.get('to_department_id'),
                'assigned_to': payload.get('assigned_to'),
                'action_type': payload.get('action_type', 'review'),
                'note': payload.get('note', ''),
                'state': 'pending',
                'date_sent': fields.Datetime.now(),
            })
            return {
                'success': True,
                'message': 'Đã thêm bước xử lý mới.',
                'route_id': new_route.id
            }
        except Exception as e:
            return {'success': False, 'error': f'Lỗi khi tạo route: {e}'}

