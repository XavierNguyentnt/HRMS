#backend\custom_addons\document_flow_ext\__manifest__.py
{
    "name": "Document Flow Extension",
    "summary": "Luồng xử lý văn bản kế thừa từ DMS",
    "version": "18.0.1.0.0",
    "author": "Your Company",
    "website": "https://yourcompany.com",
    "category": "Documents",
    "license": "LGPL-3",
    "depends": [
        "dms", 
        "mail",
    ],
    "data": [
        "security/security.xml",
        "security/ir.model.access.csv",
        "views/document_views.xml",
        "views/route_views.xml",
        "views/menu.xml",
    ],
    "installable": True,
    "application": False,
}
