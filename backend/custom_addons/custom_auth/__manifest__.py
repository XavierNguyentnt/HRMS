# -*- coding: utf-8 -*-
{
    'name': 'Custom Authentication API',
    'version': '1.0',
    'summary': 'Provides custom REST API for user registration.',
    'description': 'Adds a /auth/signup endpoint for new user creation.',
    'category': 'Tools',
    'author': 'Your Name',
    'depends': ['base', 'web'], # Phụ thuộc vào module 'web' để có http routing
    'data': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}