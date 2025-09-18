# custom_auth_signup/models/registration_whitelist.py
from odoo import models, fields

class RegistrationWhitelist(models.Model):
    _name = 'registration.whitelist'
    _description = 'Email Whitelist for Registration'
    _order = 'email'

    email = fields.Char(string='Email Address', required=True, index=True)
    is_used = fields.Boolean(string='Has Registered', default=False, readonly=True, copy=False)
    user_id = fields.Many2one('res.users', string='Registered User', readonly=True, copy=False)

    _sql_constraints = [
        ('email_uniq', 'unique (email)', 'This email address already exists in the whitelist.')
    ]