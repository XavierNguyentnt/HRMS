from odoo import models, fields, api

class ProjectTask(models.Model):
    _inherit = 'project.task'  # kế thừa model project.task

    # Ví dụ: thêm trường mới
    priority_level = fields.Selection([
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ], string='Priority Level', default='medium')
    date_start = fields.Date(string='Start Date')

    # Ví dụ: thêm tính năng tự động cập nhật trạng thái
    @api.model
    def create(self, vals):
        task = super(ProjectTask, self).create(vals)
        # logic tùy chỉnh khi tạo task mới
        return task
