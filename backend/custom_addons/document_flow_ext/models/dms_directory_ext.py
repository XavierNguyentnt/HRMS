from odoo import models, fields, api

class DmsDirectory(models.Model):
    _inherit = "dms.directory"

    active = fields.Boolean(default=True)

    @api.model
    def search(self, args, offset=0, limit=None, order=None, count=False):
        """Ẩn các bản ghi inactive trừ khi context có active_test=False."""
        if not self.env.context.get('active_test', True):
            return super(DmsDirectory, self).search(args, offset, limit, order, count)
        args = [('active', '=', True)] + (args or [])
        return super(DmsDirectory, self).search(args, offset, limit, order, count)

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
