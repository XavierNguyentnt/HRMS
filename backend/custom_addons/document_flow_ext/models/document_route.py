# backend/custom_addons/document_flow_ext/models/document_route.py
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class DocumentRoute(models.Model):
    _name = "document.route"
    _description = "Luồng xử lý văn bản"
    _order = "sequence"

    document_id = fields.Many2one(
        "dms.file", string="Văn bản", ondelete="cascade", required=True)
    sequence = fields.Integer(string="Thứ tự", default=10)
    
    from_department_id = fields.Many2one(
        "hr.department", string="Từ phòng ban", required=False)
    to_department_id = fields.Many2one(
        "hr.department", string="Đến phòng ban", required=False)
    
    assigned_to = fields.Many2one(
        "res.users", string="Người được giao xử lý", required=False)
    
    action_type = fields.Selection([
        ('review', 'Xem xét'),
        ('approve', 'Phê duyệt'),
        ('sign', 'Ký'),
        ('publish', 'Ban hành'),
        ('transfer', 'Chuyển tiếp'),
    ], string="Loại xử lý", default="review")
    
    state = fields.Selection([
        ('pending', 'Chờ xử lý'),
        ('done', 'Hoàn thành'),
        ('rejected', 'Từ chối'),
    ], string="Trạng thái", default="pending", tracking=True)
    
    note = fields.Text(string="Ghi chú")
    date_sent = fields.Datetime(string="Ngày gửi", default=fields.Datetime.now)
    date_received = fields.Datetime(string="Ngày nhận")
    processed_date = fields.Datetime(string="Ngày xử lý")

    # -------------------------------------------------------------------------
    # CHUYỂN LUỒNG SANG BƯỚC KẾ TIẾP
    # -------------------------------------------------------------------------
    @api.model
    def advance_route(self, document_id):
        """Chuyển văn bản sang bước kế tiếp."""
        doc = self.env['dms.file'].sudo().browse(document_id)
        current = self.search([
            ('document_id', '=', doc.id),
            ('state', '=', 'pending')
        ], order='sequence', limit=1)

        if not current:
            raise UserError(_("Không tìm thấy bước xử lý hiện tại."))

        # Hoàn thành bước hiện tại
        current.write({
            'state': 'done',
            'processed_date': fields.Datetime.now(),
            'date_received': fields.Datetime.now()
        })

        # Tìm bước tiếp theo
        next_step = self.search([
            ('document_id', '=', doc.id),
            ('state', '=', 'pending'),
            ('sequence', '>', current.sequence)
        ], order='sequence', limit=1)

        if next_step:
            next_step.write({'date_sent': fields.Datetime.now()})
            doc.write({'status': 'processing'})
        else:
            doc.write({'status': 'signed'})

        # Nhật ký hoặc thông báo
        if hasattr(doc, 'message_post'):
            doc.message_post(body=f"Văn bản chuyển từ {current.from_department_id.name or '-'} "
                                  f"sang {current.to_department_id.name or '-'} thành công.")
