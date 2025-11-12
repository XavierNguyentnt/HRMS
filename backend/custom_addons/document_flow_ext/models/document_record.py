#backend\custom_addons\document_flow_ext\models\document_record.py
from odoo import models, fields, api

class DocumentRecord(models.Model):
    _inherit = "dms.file"

    ref_no = fields.Char(string="Số hiệu văn bản")
    document_type = fields.Selection([
        ('incoming', 'Văn bản đến'),
        ('outgoing', 'Văn bản đi'),
        ('internal', 'Nội bộ')
    ], default='incoming', string="Loại văn bản")

    status = fields.Selection([
        ('draft','Mới'),
        ('processing','Đang xử lý'),
        ('for_sign','Trình ký'),
        ('signed','Ban hành'),
        ('archived','Lưu trữ')
    ], default='draft', string="Trạng thái", tracking=True)

    department_id = fields.Many2one('hr.department', string="Phòng ban phụ trách")
    receiver_ids = fields.Many2many('res.users', string="Người nhận")
    date_received = fields.Date(string="Ngày nhận")
    date_signed = fields.Date(string="Ngày ký")
    priority = fields.Selection([('0','Bình thường'),('1','Cao'),('2','Khẩn')], default='0')
    summary = fields.Text(string="Trích yếu")

    route_ids = fields.One2many('document.route', 'document_id', string="Luồng xử lý")

    def action_submit(self):
        self.status = 'processing'

    def action_sign(self):
        self.status = 'signed'
        self.date_signed = fields.Date.today()

    def action_archive(self):
        self.status = 'archived'

