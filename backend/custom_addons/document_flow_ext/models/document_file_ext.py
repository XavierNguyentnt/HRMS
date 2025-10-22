#backend\custom_addons\document_flow_ext\models\document_file_ext.py
from odoo import models, fields, api # ✅ Thêm 'api'

class DmsFileExtension(models.Model):
    _inherit = "dms.file"

    # ✅ THÊM TRƯỜNG ACTIVE CHO TÍNH NĂNG THÙNG RÁC
    active = fields.Boolean(default=True) 

    ref_no = fields.Char(string="Số hiệu văn bản")
    status = fields.Selection([
        ('draft', 'Dự thảo'),
        ('in_progress', 'Đang xử lý'),
        ('done', 'Hoàn thành'),
        ('cancelled', 'Đã huỷ'),
    ], string="Trạng thái", default='draft')
    department_id = fields.Many2one("hr.department", string="Phòng ban xử lý")
    date_received = fields.Date(string="Ngày nhận")

    # -------------------------------------------------------------------------
    # ✅ KHẮC PHỤC LỖI BaseModel.search() - BẮT BUỘC
    # -------------------------------------------------------------------------
    @api.model
    # Bắt *extra_args, **kwargs để nhận tất cả tham số vị trí/key có thể bị truyền nhầm
    def search(self, args, offset=0, limit=None, order=None, count=False, *extra_args, **kwargs):
        """
        Ghi đè search để kích hoạt active_test và sửa lỗi "but 6 were given".
        """
        # Nếu context có active_test=False 
        if not self.env.context.get('active_test', True):
            # ✅ CHỈ truyền 5 tham số tiêu chuẩn và **kwargs cho hàm cha
            # BỎ *extra_args ở đây!
            return super(DmsFileExtension, self).search(
                args, offset, limit, order, count, **kwargs 
            )
            
        # Mặc định: chỉ hiển thị active=True
        args = [('active', '=', True)] + (args or [])
        
        # ✅ CHỈ truyền 5 tham số tiêu chuẩn và **kwargs cho hàm cha
        # BỎ *extra_args ở đây!
        return super(DmsFileExtension, self).search(
            args, offset, limit, order, count, **kwargs
        )


    # -------------------------------------------------------------------------
    # ✅ HỖ TRỢ XÓA MỀM/CỨNG (UNLINK) VÀ KHÔI PHỤC (RESTORE)
    # -------------------------------------------------------------------------
    def unlink(self):
        """
        Xoá mềm file (active=False), chỉ xoá thật nếu context có force_unlink=True.
        """
        # Nếu không có cờ force_unlink=True trong context, thực hiện xóa mềm
        if not self.env.context.get("force_unlink", False):
            self.write({"active": False})
            return True
            
        # Nếu có cờ force_unlink=True, gọi hàm cha để xóa cứng
        return super(DmsFileExtension, self).unlink()

    def restore(self):
        """Khôi phục file (active=True)."""
        for record in self:
            record.write({"active": True})
        return True