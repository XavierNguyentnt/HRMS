from odoo import models, fields

class DocumentRoute(models.Model):
    _name = "document.route"
    _description = "Luồng xử lý văn bản"

    document_id = fields.Many2one('dms.file', string="Văn bản", ondelete='cascade')
    from_department_id = fields.Many2one('hr.department', string="Phòng ban gửi")
    to_department_id = fields.Many2one('hr.department', string="Phòng ban nhận")
    assigned_to = fields.Many2one('res.users', string="Người xử lý")
    status = fields.Selection([
        ('sent', 'Đang gửi'),
        ('received', 'Đã nhận'),
        ('processed', 'Đã xử lý')
    ], default='sent')
    date_sent = fields.Datetime(string="Ngày gửi")
    date_received = fields.Datetime(string="Ngày nhận")
    note = fields.Text(string="Ghi chú")
