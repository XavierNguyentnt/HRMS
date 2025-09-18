# custom_auth_signup/models/res_users.py
from odoo import models, api, _
from odoo.exceptions import UserError

class ResUsers(models.Model):
    _inherit = 'res.users'

    @api.model
    def _signup_create_user(self, values):
        """
        Ghi đè phương thức gốc để tạo người dùng nội bộ (thay vì portal)
        và tạo luôn hồ sơ nhân viên tương ứng.
        """
        # Tạo người dùng bằng phương thức gốc
        user = super(ResUsers, self.with_context(no_reset_password=True))._signup_create_user(values)
        user = self.browse(user)
        
        # Gán quyền "Internal User" và xóa các quyền không cần thiết
        internal_user_group = self.env.ref('base.group_user', raise_if_not_found=False)
        portal_group = self.env.ref('base.group_portal', raise_if_not_found=False)
        if portal_group:
            user.write({'groups_id': [(3, portal_group.id)]}) # Xóa khỏi nhóm Portal
        if internal_user_group:
            user.write({'groups_id': [(4, internal_user_group.id)]}) # Thêm vào nhóm Internal User
        
        # Sudo() vì user public không có quyền tạo nhân viên
        self.env['hr.employee'].sudo().create({
            'name': user.name,
            'work_email': user.email,
            'user_id': user.id,
            'active': False, # Tạo nhân viên cũng ở trạng thái inactive
        })
        return user.id

    def action_approve_user(self):
        """
        Hành động được gọi bởi nút "Approve User" trên form view.
        """
        for user in self:
            if not self.env.user.has_group('base.group_system'):
                 raise UserError(_("Only administrators can approve users."))

            # Kích hoạt user và nhân viên liên quan
            user.write({'active': True})
            if user.employee_ids:
                user.employee_ids.write({'active': True})
            
            # Đánh dấu email trong whitelist đã được sử dụng
            whitelist_entry = self.env['registration.whitelist'].sudo().search([('email', '=', user.login)], limit=1)
            if whitelist_entry and not whitelist_entry.is_used:
                whitelist_entry.write({'is_used': True, 'user_id': user.id})

            # Gửi email thông báo tài khoản đã được phê duyệt
            template = self.env.ref('custom_auth_signup.mail_template_user_signup_approved', raise_if_not_found=False)
            if template:
                template.send_mail(user.id, force_send=True)