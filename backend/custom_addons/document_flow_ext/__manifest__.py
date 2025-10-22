# -*- coding: utf-8 -*-
{
    'name': 'Document Flow Extension',
    'version': '1.0.0',
    'summary': 'Bổ sung tính năng quản lý luồng văn bản',
    'category': 'Documents',
    'author': 'Auto-fixed',
    'website': '',
    'license': 'LGPL-3',
    'depends': [
        'dms',
        'hr',
    ],
    'data': [
        'views/dms_file_view_ext.xml',
        'views/document_views.xml',
        'views/menu.xml',
        'views/route_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
