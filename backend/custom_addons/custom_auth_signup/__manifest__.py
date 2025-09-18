# custom_auth_signup/__manifest__.py
{
    'name': 'Custom Auth Signup with Approval',
    'version': '1.0',
    'summary': 'Adds admin approval and email whitelisting to the signup process.',
    'author': 'KDPD_HRMS Assistant',
    'depends': ['auth_signup', 'hr', 'mail'], # Thêm dependency
    'data': [
        'security/ir.model.access.csv',
        'security/security.xml',
        'views/whitelist_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}