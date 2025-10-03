import os
import requests
import json
import logging
import re
from fastapi import FastAPI, HTTPException, Depends, APIRouter
from pydantic import BaseModel
from typing import List, Any
from datetime import datetime

# =========================================================
# Cấu hình logging cơ bản
# =========================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================
# LẤY CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG
# =========================================================
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral") 

# Thông tin kết nối Odoo
ODOO_URL = os.getenv("ODOO_URL")
ODOO_DB = os.getenv("ODOO_DB")
ODOO_USER = os.getenv("ODOO_USER")
ODOO_PASSWORD = os.getenv("ODOO_PASSWORD")

# =========================================================
# KHỞI TẠO APP VÀ ROUTER
# =========================================================
app = FastAPI(title="KDPD HRMS AI API")
api_router = APIRouter(prefix="/api/ai")

# =========================================================
# CÁC MODEL DỮ LIỆU (PYDANTIC)
# =========================================================
class SummarizationRequest(BaseModel):
    project_id: int
    days_ago: int = 7

class AnalysisRequest(BaseModel):
    project_id: int

class MultiProjectAnalysisRequest(BaseModel):
    project_ids: List[int]

# =========================================================
# QUẢN LÝ KẾT NỐI ODOO
# =========================================================
def get_odoo_client():
    if not all([ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD]):
        logger.error("Các biến môi trường Odoo chưa được thiết lập!")
        raise HTTPException(status_code=500, detail="Cấu hình Odoo phía server bị thiếu.")
    
    try:
        import odoorpc
        odoo = odoorpc.ODOO(ODOO_URL.replace("http://", ""), protocol='jsonrpc', port=8069)
        odoo.login(ODOO_DB, ODOO_USER, ODOO_PASSWORD)
        logger.info(f"Đã kết nối thành công đến Odoo DB: {ODOO_DB}")
        yield odoo
    except Exception as e:
        logger.error(f"Không thể kết nối đến Odoo: {e}")
        raise HTTPException(status_code=503, detail=f"Không thể kết nối đến dịch vụ Odoo: {e}")

# =========================================================
# CÁC ENDPOINT CỦA API
# =========================================================

@api_router.get("/")
def read_root():
    """Endpoint gốc để kiểm tra API có hoạt động không."""
    return {"message": "Chào mừng bạn đến với BFF API cho KDPD_HRMS!"}

@api_router.post("/summarize")
async def summarize_project(request: SummarizationRequest, odoo: Any = Depends(get_odo_client)):
    logger.info(f"Nhận yêu cầu tóm tắt dự án ID: {request.project_id}")
    try:
        domain = [
            ('res_id', '=', request.project_id),
            ('model', '=', 'project.project'),
        ]
        messages = odoo.env['mail.message'].search_read(domain, ['body', 'author_id', 'date'], order='date desc', limit=30)
        
        activities_text = ""
        for msg in messages:
            clean_body = re.sub('<.*?>', '', msg['body']).strip()
            if clean_body:
                activities_text += f"- Vào lúc {msg['date']}, {msg['author_id'][1]} đã viết: {clean_body}\n"

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy dữ liệu Odoo: {e}")

    if not activities_text:
        return {"summary": "Không có hoạt động nào gần đây trong dự án này."}

    prompt = f"""
    Bạn là một trợ lý quản lý dự án AI. Hãy đọc qua danh sách các hoạt động và bình luận của một dự án và tóm tắt lại những điểm chính một cách ngắn gọn, chuyên nghiệp.

    Dữ liệu hoạt động:
    ---
    {activities_text}
    ---

    Dựa vào dữ liệu trên, hãy tóm tắt các hoạt động chính của dự án thành 3 đến 5 gạch đầu dòng quan trọng nhất.
    """

    try:
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=120)
        response.raise_for_status()
        summary_text = response.json().get('response', 'Không thể tạo tóm tắt.')
        return {"summary": summary_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi dịch vụ AI: {e}")

@api_router.post("/analyze")
async def analyze_project(request: AnalysisRequest, odoo: Any = Depends(get_odo_client)):
    logger.info(f"Nhận yêu cầu phân tích dự án ID: {request.project_id}")
    try:
        tasks_data = odoo.env['project.task'].search_read(
            [('project_id', '=', request.project_id)],
            ['name', 'stage_id', 'user_id', 'date_deadline']
        )
        
        if not tasks_data:
            return {"analysis": {"message": "Dự án chưa có công việc nào để phân tích."}}
            
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        tasks_json_for_prompt = json.dumps(tasks_data, indent=2, default=str)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy dữ liệu Odoo: {e}")

    prompt = f"""
    Bạn là một chuyên gia phân tích hiệu suất dự án AI. Dựa vào dữ liệu JSON về các công việc của một dự án dưới đây, hãy thực hiện các phân tích sau:
    1. Xác định các công việc đã trễ hạn.
    2. Phân tích sự phân bổ công việc cho mỗi người dùng.
    3. Đưa ra các đề xuất cụ thể để cải thiện.

    Dữ liệu công việc:
    ```json
    {tasks_json_for_prompt}
    ```
    Ngày hôm nay là: {current_date_str}

    YÊU CẦU TUYỆT ĐỐI: Trả về kết quả dưới dạng một object JSON duy nhất có cấu trúc sau, không có giải thích nào khác:
    {{
      "overdue_tasks": [{{ "task_name": "Tên công việc", "assigned_to": "Tên người thực hiện", "deadline": "YYYY-MM-DD" }}],
      "workload_analysis": [{{ "member_name": "Tên người thực hiện", "task_count": 5 }}],
      "suggestions": ["Đề xuất 1", "Đề xuất 2"]
    }}
    """
    
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "format": "json", "stream": False}
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=120)
        response.raise_for_status()
        analysis_json_str = response.json().get('response', '{}')
        analysis_data = json.loads(analysis_json_str)
        return {"analysis": analysis_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi dịch vụ AI: {e}")

@api_router.post("/analyze-multiple-projects")
async def analyze_multiple_projects(request: MultiProjectAnalysisRequest, odoo: Any = Depends(get_odo_client)):
    if not request.project_ids:
        return {"analysis": {"message": "Không có dự án nào để phân tích."}}

    logger.info(f"Nhận yêu cầu phân tích {len(request.project_ids)} dự án.")
    try:
        tasks_data = odoo.env['project.task'].search_read(
            [('project_id', 'in', request.project_ids)],
            ['name', 'stage_id', 'user_id', 'date_deadline', 'project_id']
        )
        
        if not tasks_data:
            return {"analysis": {"message": "Các dự án được chọn chưa có công việc nào để phân tích."}}
            
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        tasks_json_for_prompt = json.dumps(tasks_data, indent=2, default=str)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy dữ liệu Odoo: {e}")

    prompt = f"""
    Bạn là một chuyên gia phân tích hiệu suất dự án AI. Dựa vào dữ liệu JSON về các công việc từ NHIỀU dự án dưới đây, hãy thực hiện các phân tích TỔNG QUAN sau:
    1.  Xác định các công việc ĐÃ TRỄ HẠN trên tất cả các dự án.
    2.  Phân tích sự PHÂN BỔ CÔNG VIỆC chung cho mỗi người dùng, xác định ai có thể đang quá tải nhất.
    3.  Đưa ra các ĐỀ XUẤT mang tính chiến lược để cải thiện tình hình chung.

    Dữ liệu công việc từ nhiều dự án:
    ```json
    {tasks_json_for_prompt}
    ```
    Ngày hôm nay là: {current_date_str}

    YÊU CẦU TUYỆT ĐỐI: Trả về kết quả dưới dạng một object JSON duy nhất có cấu trúc sau:
    {{
      "overdue_tasks": [{{ "task_name": "Tên công việc", "project_name": "Tên dự án", "assigned_to": "Tên người thực hiện", "deadline": "YYYY-MM-DD" }}],
      "workload_analysis": [{{ "member_name": "Tên người thực hiện", "task_count": 15 }}],
      "suggestions": ["Đề xuất tổng quan 1", "Đề xuất tổng quan 2"]
    }}
    """
    
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "format": "json", "stream": False}
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=180)
        response.raise_for_status()
        analysis_json_str = response.json().get('response', '{}')
        analysis_data = json.loads(analysis_json_str)
        return {"analysis": analysis_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi dịch vụ AI: {e}")

# =========================================================
# ĐÍNH KÈM ROUTER VÀO APP CHÍNH
# =========================================================
app.include_router(api_router)