from odoo import models, fields, api
import uuid

class ResUsers(models.Model):
    _inherit = 'res.users'

    signup_token = fields.Char('Signup Token', readonly=True)
    email_verified = fields.Boolean('Email Verified', default=False)

    @api.model
    def create(self, vals):
        # User mới luôn inactive
        vals['active'] = False
        # Tạo token xác thực email
        vals['signup_token'] = str(uuid.uuid4())
        user = super(ResUsers, self).create(vals)
        user._send_verification_email()
        return user

    def _send_verification_email(self):
        template = self.env.ref('user_signup_approval.email_template_user_verification', raise_if_not_found=False)
        if template:
            template.send_mail(self.id, force_send=True)
