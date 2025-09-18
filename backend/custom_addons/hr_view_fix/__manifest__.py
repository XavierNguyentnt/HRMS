# -*- coding: utf-8 -*-
{
    'name': 'HR Employee Form View JS Fix',
    'version': '1.0',
    'summary': 'Disable conflicting JS class on HR Employee form view.',
    'description': """
        This module removes the js_class="hr_employee_form" from the employee form view
        to prevent the 405 error on /hr/get_org_chart, likely caused by a missing
        org chart widget in the inherited view.
    """,
    'category': 'Human Resources',
    'author': 'Your Name',
    'depends': [
        'hr', # Phụ thuộc vào module hr gốc
    ],
    'data': [
        'views/hr_employee_views.xml', # Khai báo file view
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}