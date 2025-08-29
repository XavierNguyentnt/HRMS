# custom_auth/controllers/main.py
import json
from odoo import http
from odoo.http import request, Response
import logging

_logger = logging.getLogger(__name__)

class AuthController(http.Controller):

    def _signup_validator(self, data):
        required_fields = ['name', 'login', 'password']
        for field in required_fields:
            if not data.get(field):
                return f"Trường '{field}' là bắt buộc."
        return None
    
    def _json_response(self, success=True, data=None, status=200):
        body = { 'success': success, 'data': data }
        return Response(json.dumps(body), content_type='application/json', status=status)


    @http.route('/auth/signup', type='json', auth='public', methods=['POST'], csrf=False)
    def signup(self, **kw):
        params = request.get_json_data().get('params', {})
        _logger.info("Yêu cầu đăng ký nhận được với dữ liệu: %s", params)

        error_message = self._signup_validator(params)
        if error_message:
            return self._json_response(success=False, data={'message': error_message}, status=400)

        user_data = {
            'name': params.get('name'),
            'login': params.get('login'),
            'password': params.get('password'),
            'groups_id': [(6, 0, [request.env.ref('base.group_user').id])]
        }

        try:
            if request.env['res.users'].sudo().search([('login', '=', user_data['login'])]):
                return self._json_response(success=False, data={'message': 'Email này đã được sử dụng.'}, status=409)

            new_user = request.env['res.users'].sudo().create(user_data)
            request.env.cr.commit()
            _logger.info("Tạo và commit người dùng mới thành công với ID: %s", new_user.id)
            
            # ==========================================================
            # GIẢI PHÁP ĐƠN GIẢN VÀ ĐÚNG ĐẮN NHẤT
            # Gọi hàm authenticate trực tiếp từ session với db, login, password
            
            db = request.session.db
            login = user_data['login']
            password = user_data['password']

            # Hàm này sẽ tự động cập nhật session hiện tại nếu thành công
            request.session.authenticate(db, login, password)
            # ==========================================================
            
            session_info = request.env['ir.http'].session_info()
            return self._json_response(data=session_info, status=200)

        except Exception as e:
            _logger.error("Lỗi khi đăng ký: %s", str(e))
            request.env.cr.rollback()
            error_data = {'message': f"Đã xảy ra lỗi không mong muốn: {str(e)}"}
            return self._json_response(success=False, data=error_data, status=500)