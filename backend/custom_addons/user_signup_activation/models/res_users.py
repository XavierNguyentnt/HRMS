from odoo import models, fields, api
import uuid

class ResUsers(models.Model):
    _inherit = "res.users"

    signup_token = fields.Char("Signup Token", readonly=True)
    active = fields.Boolean(default=False)

    @api.model
    def create(self, vals):
        vals['active'] = False  # user inactive
        vals['signup_token'] = str(uuid.uuid4())
        user = super(ResUsers, self).create(vals)
        user._send_signup_email()
        return user

    def get_signup_url(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        return f"{base_url}/web/signup/{self.signup_token}"

    def _send_signup_email(self):
        template = self.env.ref('user_signup_activation.email_template_user_activation', raise_if_not_found=False)
        if template:
            template.send_mail(self.id, force_send=True)
