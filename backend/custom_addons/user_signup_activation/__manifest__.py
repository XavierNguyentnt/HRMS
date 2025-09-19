# __manifest__.py
{
    "name": "User Signup Activation",
    "version": "18.0.1.0.0",
    "summary": "Kích hoạt tài khoản người dùng thông qua email",
    "description": "Admin tạo user → gửi email → user kích hoạt bằng link → tạo password → active",
    "category": "Tools",
    "author": "Your Name",
    "depends": ["base", "mail", "base_user_role"],
    "data": [
        "views/email_template.xml",
    ],
    "installable": True,
    "application": False,
    "license": "LGPL-3",
}
