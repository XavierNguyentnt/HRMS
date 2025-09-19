from odoo import http
from odoo.http import request

class AuthController(http.Controller):

    @http.route('/web/signup/<string:token>', type='http', auth='public', website=True)
    def signup(self, token, **kwargs):
        user = request.env['res.users'].sudo().search([('signup_token','=',token)], limit=1)
        if not user:
            return "Token không hợp lệ hoặc đã hết hạn."

        if request.httprequest.method == 'POST':
            password = kwargs.get('password')
            confirm_password = kwargs.get('confirm_password')
            if not password or password != confirm_password:
                return "Mật khẩu không hợp lệ hoặc không trùng khớp."
            user.sudo().write({'password': password, 'active': True, 'signup_token': False})
            return "Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ."
        
        return """
        <form method="POST">
            <label>Mật khẩu mới:</label><br/>
            <input type="password" name="password"/><br/>
            <label>Xác nhận mật khẩu:</label><br/>
            <input type="password" name="confirm_password"/><br/>
            <button type="submit">Kích hoạt tài khoản</button>
        </form>
        """
