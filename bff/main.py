import os
import requests
import json
import logging
import re
import uuid
from fastapi import FastAPI, HTTPException, Depends, APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List, Any, Dict
from datetime import datetime
from urllib.parse import urlparse

# =========================================================
# CẤU HÌNH LOGGING
# =========================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================
# LẤY CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG
# =========================================================
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
AI_REQUEST_TIMEOUT = int(os.getenv("AI_REQUEST_TIMEOUT", 600))

ODOO_URL = os.getenv("ODOO_URL")
ODOO_DB = os.getenv("ODOO_DB")
ODOO_USER = os.getenv("ODOO_USER")
ODOO_PASSWORD = os.getenv("ODOO_PASSWORD")

# =========================================================
# KHỞI TẠO APP VÀ BỘ NHỚ LƯU TRỮ KẾT QUẢ
# =========================================================
app = FastAPI(title="KDPD HRMS AI API")
api_router = APIRouter(prefix="/api/ai")
analysis_results: Dict[str, Any] = {}

# =========================================================
# MODEL DỮ LIỆU
# =========================================================
class SummarizationRequest(BaseModel):
    project_id: int
    days_ago: int = 7

class AnalysisRequest(BaseModel):
    project_id: int

class MultiProjectAnalysisRequest(BaseModel):
    project_ids: List[int]
    
class AsyncTaskResponse(BaseModel):
    task_id: str
    status: str
    message: str

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Any | None = None

# =========================================================
# DEPENDENCY KẾT NỐI ODOO
# =========================================================
def get_odoo_client():
    if not all([ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD]):
        logger.error("⚠️  Thiếu biến môi trường Odoo.")
        raise HTTPException(status_code=500, detail="Cấu hình Odoo phía server bị thiếu.")
    try:
        import odoorpc
        parsed = urlparse(ODOO_URL)
        host = parsed.hostname or ODOO_URL
        port = parsed.port or 8069
        logger.info(f"🔗 Kết nối Odoo host={host}, port={port}, db={ODOO_DB}")
        odoo = odoorpc.ODOO(host, protocol='jsonrpc', port=port)
        odoo.login(ODOO_DB, ODOO_USER, ODOO_PASSWORD)
        logger.info(f"✅ Đã kết nối thành công đến Odoo DB: {ODOO_DB}")
        yield odoo
    except Exception as e:
        logger.error(f"❌ Lỗi khi kết nối Odoo: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Không thể kết nối đến Odoo: {e}")

# =========================================================
# HÀM XỬ LÝ NỀN CHO TÁC VỤ PHÂN TÍCH
# =========================================================
def run_ai_analysis_in_background(task_id: str, prompt: str):
    logger.info(f"🚀 Bắt đầu tác vụ nền task_id={task_id}")
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "format": "json", "stream": False}
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate", 
            json=payload, 
            timeout=AI_REQUEST_TIMEOUT
        )
        response.raise_for_status()
        analysis_json_str = response.json().get('response', '{}')
        analysis_data = json.loads(analysis_json_str)
        analysis_results[task_id] = {"status": "completed", "result": analysis_data}
        logger.info(f"✅ Tác vụ nền task_id={task_id} hoàn tất.")
    except Exception as e:
        error_message = f"Lỗi khi thực thi tác vụ nền task_id={task_id}: {e}"
        logger.error(f"❌ {error_message}", exc_info=True)
        analysis_results[task_id] = {"status": "failed", "result": {"error": error_message}}

# =========================================================
# API ENDPOINTS
# =========================================================

@api_router.get("/")
def read_root():
    return {"message": "Chào mừng bạn đến với BFF API cho KDPD_HRMS!"}

@api_router.post("/summarize")
async def summarize_project(request: SummarizationRequest, odoo: Any = Depends(get_odoo_client)):
    logger.info(f"🧩 Nhận yêu cầu tóm tắt dự án ID={request.project_id}")
    try:
        domain = [('res_id', '=', request.project_id), ('model', '=', 'project.project')]
        messages = odoo.env['mail.message'].search_read(domain, ['body', 'author_id', 'date'], order='date desc', limit=30)
        activities_text = ""
        for msg in messages:
            clean_body = re.sub('<.*?>', '', msg['body']).strip()
            if clean_body:
                activities_text += f"- {msg['author_id'][1]} ({msg['date']}): {clean_body}\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy dữ liệu Odoo: {e}")

    if not activities_text:
        return {"summary": "Không có hoạt động nào gần đây trong dự án này."}

    prompt = f"Bạn là một trợ lý quản lý dự án AI. Dưới đây là danh sách hoạt động:\n---\n{activities_text}\n---\nHãy tóm tắt lại các điểm chính trong 3–5 gạch đầu dòng."
    
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=AI_REQUEST_TIMEOUT)
        response.raise_for_status()
        summary_text = response.json().get('response', 'Không thể tạo tóm tắt.')
        return {"summary": summary_text}
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Yêu cầu đến dịch vụ AI bị timeout.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi dịch vụ AI: {e}")


@api_router.post("/analyze", response_model=AsyncTaskResponse)
async def analyze_project(
    request: AnalysisRequest, 
    background_tasks: BackgroundTasks, 
    odoo: Any = Depends(get_odoo_client)
):
    logger.info(f"🧠 Nhận yêu cầu phân tích dự án ID={request.project_id}")
    try:
        # [SỬA LỖI] Thay 'user_id' bằng 'user_ids'
        tasks_data = odoo.env['project.task'].search_read(
            [('project_id', '=', request.project_id)],
            ['name', 'stage_id', 'user_ids', 'date_deadline']
        )
        if not tasks_data:
            raise HTTPException(status_code=404, detail="Dự án chưa có công việc nào để phân tích.")

        tasks_json_for_prompt = json.dumps(tasks_data, indent=2, default=str)
        current_date_str = datetime.now().strftime("%Y-%m-%d")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy dữ liệu Odoo: {e}")

    prompt = f"""
    Bạn là một chuyên gia phân tích hiệu suất dự án AI.
    Hãy phân tích và trả về một đối tượng JSON với các key sau: "overdue_tasks", "workload_analysis", và "suggestions".
    Dữ liệu công việc:
    ```json
    {tasks_json_for_prompt}
    ```
    Ngày hôm nay là: {current_date_str}
    """
    
    task_id = str(uuid.uuid4())
    analysis_results[task_id] = {"status": "processing", "result": None}
    background_tasks.add_task(run_ai_analysis_in_background, task_id, prompt)
    
    return {"task_id": task_id, "status": "processing", "message": "Yêu cầu phân tích đã được chấp nhận và đang được xử lý."}


@api_router.post("/analyze-multiple-projects", response_model=AsyncTaskResponse)
async def analyze_multiple_projects(
    request: MultiProjectAnalysisRequest, 
    background_tasks: BackgroundTasks, 
    odoo: Any = Depends(get_odoo_client)
):
    if not request.project_ids:
        raise HTTPException(status_code=400, detail="Không có dự án nào được chọn để phân tích.")

    logger.info(f"🧩 Nhận yêu cầu phân tích {len(request.project_ids)} dự án")
    try:
        tasks_data_raw = odoo.env['project.task'].search_read(
            [('project_id', 'in', request.project_ids)],
            # [SỬA LỖI] Đọc trường 'user_ids' thay vì 'user_id'
            ['name', 'stage_id', 'user_ids', 'date_deadline', 'project_id']
        )
        if not tasks_data_raw:
            raise HTTPException(status_code=404, detail="Các dự án đã chọn không có công việc nào để phân tích.")

        # Lấy danh sách ID của tất cả người dùng liên quan để truy vấn tên một lần
        all_user_ids = {uid for t in tasks_data_raw for uid in t.get('user_ids', [])}
        user_names = {u['id']: u['name'] for u in odoo.env['res.users'].browse(list(all_user_ids)).read(['name'])}

        tasks_data_processed = []
        for t in tasks_data_raw:
            # [SỬA LỖI] Xử lý trường 'user_ids' là một danh sách và lấy tên
            assignee_names = [user_names.get(uid) for uid in t.get('user_ids', []) if user_names.get(uid)]

            tasks_data_processed.append({
                "name": t.get("name"),
                "stage": t.get("stage_id")[1] if t.get("stage_id") else None,
                "assignees": ", ".join(assignee_names), # Nối tên nếu có nhiều người
                "deadline": t.get("date_deadline"),
                "project_name": t.get("project_id")[1] if t.get("project_id") else None,
            })

        tasks_json_for_prompt = json.dumps(tasks_data_processed, indent=2, default=str)
        current_date_str = datetime.now().strftime("%Y-%m-%d")
    except Exception as e:
        logger.error(f"Lỗi khi xử lý dữ liệu từ Odoo: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý dữ liệu từ Odoo: {e}")

    prompt = f"""
    Bạn là một chuyên gia phân tích AI. Dựa trên dữ liệu từ nhiều dự án, hãy phân tích và trả về một đối tượng JSON với các key sau: "overdue_tasks_summary", "cross_project_workload", và "strategic_suggestions".
    Dữ liệu công việc:
    ```json
    {tasks_json_for_prompt}
    ```
    Ngày hôm nay là: {current_date_str}
    """
    
    task_id = str(uuid.uuid4())
    analysis_results[task_id] = {"status": "processing", "result": None}
    background_tasks.add_task(run_ai_analysis_in_background, task_id, prompt)
    
    return {"task_id": task_id, "status": "processing", "message": "Yêu cầu phân tích đã được chấp nhận và đang được xử lý."}


@api_router.get("/analysis/status/{task_id}", response_model=TaskStatusResponse)
async def get_analysis_status(task_id: str):
    logger.info(f"🔍 Kiểm tra trạng thái cho task_id={task_id}")
    task = analysis_results.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy tác vụ.")
    
    return {"task_id": task_id, "status": task["status"], "result": task["result"]}

# =========================================================
# GẮN ROUTER
# =========================================================
app.include_router(api_router)