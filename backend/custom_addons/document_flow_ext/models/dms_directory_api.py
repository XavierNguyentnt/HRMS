# custom_addons/document_flow_ext/models/dms_directory_api.py
from odoo import models, api

class DmsDirectoryApi(models.Model):
    _inherit = 'dms.directory'

    @api.model
    def get_all_directories_for_api(self, domain=None, fields=None):
        """
        Phương thức này AN TOÀN để gọi từ bên ngoài qua RPC.
        Nó sử dụng sudo() bên trong server Odoo để bỏ qua các quy tắc bảo mật
        và lấy về tất cả thư mục theo yêu cầu.
        """
        domain = domain if domain is not None else []
        if fields is None:
            fields = ['id', 'name', 'parent_id', 'complete_name']

        # .sudo() được dùng an toàn ở phía backend Odoo
        all_directories = self.env['dms.directory'].sudo().search_read(
            domain=domain,
            fields=fields
        )
        return all_directories