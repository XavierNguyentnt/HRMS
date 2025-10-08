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
        "views/menu.xml",
        "views/document_flow_views.xml",
        # thêm file security nếu có
    ],
    "installable": True,
    "application": True,
}
