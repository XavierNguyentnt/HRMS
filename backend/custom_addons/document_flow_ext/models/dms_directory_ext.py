#backend\custom_addons\document_flow_ext\models\dms_directory_ext.py
from odoo import models, fields, api

class DmsDirectory(models.Model):
    _inherit = "dms.directory"

    active = fields.Boolean(default=True)

    @api.model
    # Giữ *extra_args, **kwargs ở đây để bắt các tham số không mong muốn
    def search(self, args, offset=0, limit=None, order=None, count=False, *extra_args, **kwargs):
        """
        Sửa lỗi: Loại bỏ *extra_args khi gọi super().search
        """
        # ... code xử lý domain như hiện tại ...
        if not self.env.context.get('active_test', True):
            # CHỈ truyền 5 tham số tiêu chuẩn và **kwargs
            return super(DmsDirectory, self).search(
                args, offset, limit, order, count, **kwargs
            )
            
        args = [('active', '=', True)] + (args or [])
        
        # CHỈ truyền 5 tham số tiêu chuẩn và **kwargs
        return super(DmsDirectory, self).search(
            args, offset, limit, order, count, **kwargs
        )

    def unlink(self):
        """Xoá mềm thư mục (active=False), chỉ xoá thật nếu force_unlink=True."""
        if not self.env.context.get("force_unlink", False):
            self.write({"active": False})
            if self.file_ids:
                self.file_ids.write({"active": False})
            if self.child_directory_ids:
                self.child_directory_ids.write({"active": False})
            return True
        return super(DmsDirectory, self).unlink()

    def restore(self):
        """Khôi phục thư mục và các con của nó."""
        for record in self:
            record.write({"active": True})
            if record.child_directory_ids:
                record.child_directory_ids.restore()
            if record.file_ids:
                record.file_ids.write({"active": True})
        return True
