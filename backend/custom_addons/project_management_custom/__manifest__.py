{
    'name': 'Project Management Custom',
    'version': "18.0.1.0.0",
    'summary': 'Custom enhancements for Project module',
    'description': 'Add custom features and fields to the Odoo Project module',
    'category': 'Project',
    'author': 'Your Name',
    'depends': ['project'],  # kế thừa module gốc
    'data': [
        'views/project_task_views.xml',
    ],
    'installable': True,
    'application': False,
}
