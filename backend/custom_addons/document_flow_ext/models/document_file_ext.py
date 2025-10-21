#backend\custom_addons\document_flow_ext\models\document_file_ext.py
from odoo import models, fields

class DmsFileExtension(models.Model):
    _inherit = "dms.file"

    ref_no = fields.Char(string="Số hiệu văn bản")
    status = fields.Selection([
        ('draft', 'Dự thảo'),
        ('in_progress', 'Đang xử lý'),
        ('done', 'Hoàn thành'),
        ('cancelled', 'Đã huỷ'),
    ], string="Trạng thái", default='draft')
    department_id = fields.Many2one("hr.department", string="Phòng ban xử lý")
    date_received = fields.Date(string="Ngày nhận")
