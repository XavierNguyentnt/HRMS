# -*- coding: utf-8 -*-
from odoo import models, fields

class PreapprovedEmployee(models.Model):
    _name = 'hr.preapproved.employee'
    _description = 'Pre-approved Employee for Registration'

    name = fields.Char(string='Tên nhân viên', required=True)
    email = fields.Char(string='Email', required=True)
    state = fields.Selection([
        ('new', 'Mới'),
        ('registered', 'Đã đăng ký'),
    ], string='Trạng thái', default='new', readonly=True)

    _sql_constraints = [
        ('email_uniq', 'unique (email)', 'Email này đã được thêm vào danh sách!')
    ]