from odoo import http
from odoo.http import request
import json

class AuthController(http.Controller):

    @http.route('/api/signup', type='json', auth='public', methods=['POST'])
    def api_signup(self, **kwargs):
        try:
            email = kwargs.get('email')
            name = kwargs.get('name')
            password = kwargs.get('password')

            existing = request.env['res.users'].sudo().search([('login','=',email)], limit=1)
            if existing:
                return {'success': False, 'error': 'Email đã tồn tại'}

            user = request.env['res.users'].sudo().create({
                'name': name,
                'login': email,
                'email': email,
                'password': password
            })
            return {'success': True, 'message': 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực.'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/verify_email/<string:token>', type='http', auth='public', methods=['GET'])
    def verify_email(self, token, **kwargs):
        user = request.env['res.users'].sudo().search([('signup_token','=',token)], limit=1)
        if not user:
            return "Token không hợp lệ"
        user.sudo().write({'email_verified': True})
        return "Email đã được xác thực, chờ admin phê duyệt tài khoản"

    @http.route('/api/users/pending', type='json', auth='user', methods=['GET'])
    def get_pending_users(self, **kwargs):
        if not request.env.user.has_group('base.group_system'):  # chỉ admin
            return {'success': False, 'error': 'Bạn không có quyền'}
        pending_users = request.env['res.users'].sudo().search([('active','=',False)])
        data = [{'id': u.id, 'name': u.name, 'email': u.email, 'email_verified': u.email_verified} for u in pending_users]
        return {'success': True, 'users': data}

    @http.route('/api/users/approve', type='json', auth='user', methods=['POST'])
    def approve_user(self, **kwargs):
        if not request.env.user.has_group('base.group_system'):  # chỉ admin
            return {'success': False, 'error': 'Bạn không có quyền'}
        user_id = kwargs.get('user_id')
        user = request.env['res.users'].sudo().browse(user_id)
        if not user:
            return {'success': False, 'error': 'User không tồn tại'}
        if not user.email_verified:
            return {'success': False, 'error': 'User chưa xác thực email'}
        user.sudo().write({'active': True})
        return {'success': True, 'message': f'User {user.login} đã được phê duyệt'}
