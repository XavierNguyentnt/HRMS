import os
import requests
import json
import logging
from fastapi import FastAPI, HTTPException, Depends, APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

# =========================================================
# Cấu hình logging cơ bản
# =========================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================
# LẤY CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG
# =========================================================
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
# GỢI Ý: Đưa tên model ra biến môi trường
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
class TaskGenerationRequest(BaseModel):
    project_goal: str
    project_context: str | None = None
    project_id: int

# =========================================================
# QUẢN LÝ KẾT NỐI ODOO
# =========================================================
# GỢI Ý: Dùng dependency injection của FastAPI để quản lý kết nối
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

@api_router.post("/generate-tasks")
async def generate_tasks_endpoint(request: TaskGenerationRequest, odoo: Any = Depends(get_odoo_client)):
    """
    Endpoint chính để phân tích yêu cầu và tạo các công việc con bằng AI.
    """
    logger.info(f"Nhận yêu cầu tạo tác vụ cho dự án ID: {request.project_id}")

    # --- Bước 1: Lấy dữ liệu ngữ cảnh từ Odoo ---
    try:
        project_env = odoo.env['project.project']
        project = project_env.browse(request.project_id)
        if not project:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dự án với ID: {request.project_id}")
        
        members = [member.name for member in project.member_ids]
        members_list_str = ", ".join(members) if members else "Không có thành viên nào được chỉ định"
    except Exception as e:
        logger.error(f"Lỗi khi lấy dữ liệu dự án từ Odoo: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi truy vấn dữ liệu Odoo: {e}")

    # --- Bước 2: Xây dựng Prompt chi tiết cho AI ---
    prompt = f"""
    Với vai trò là một quản lý dự án AI xuất sắc, hãy phân tích yêu cầu sau đây.
    Mục tiêu chính của dự án: "{request.project_goal}"
    Bối cảnh và thông tin bổ sung: "{request.project_context or 'Không có'}"
    Dựa trên các thông tin trên, hãy phân rã mục tiêu thành một danh sách các công việc con cụ thể và chi tiết.
    Danh sách thành viên có thể giao việc: {members_list_str}.
    Hãy trả về kết quả dưới dạng một mảng JSON. Mỗi phần tử trong mảng là một đối tượng công việc, bao gồm các trường sau:
    - "name": Tên công việc (phải thật ngắn gọn, súc tích).
    - "description": Mô tả chi tiết các bước cần làm để hoàn thành công việc.
    - "assignee_suggestion": Đề xuất một người phù hợp từ danh sách thành viên để thực hiện. Nếu không có ai phù hợp, để trống.
    YÊU CẦU TUYỆT ĐỐI: Chỉ trả về mảng JSON, không bao gồm bất kỳ văn bản giải thích, markdown hay ghi chú nào khác.
    """
    logger.info("Đã tạo prompt. Đang gửi yêu cầu đến Ollama...")

    # --- Bước 3: Gửi yêu cầu đến Ollama ---
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "format": "json",
            "stream": False
        }
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=120)
        response.raise_for_status()
        
        response_data = response.json()
        tasks_json_string = response_data.get('response', '[]')
        tasks = json.loads(tasks_json_string)

        logger.info(f"Ollama đã trả về {len(tasks)} tác vụ.")
        return {"tasks": tasks}

    except requests.exceptions.RequestException as e:
        logger.error(f"Lỗi khi gọi đến Ollama: {e}")
        raise HTTPException(status_code=503, detail=f"Không thể kết nối đến dịch vụ AI (Ollama): {e}")
    except json.JSONDecodeError:
        logger.error(f"Ollama không trả về JSON hợp lệ. Raw response: {tasks_json_string}")
        raise HTTPException(status_code=500, detail="Dịch vụ AI đã trả về dữ liệu không hợp lệ.")
    except Exception as e:
        logger.error(f"Lỗi không xác định: {e}")
        raise HTTPException(status_code=500, detail="Đã có lỗi xảy ra trong quá trình xử lý.")

# =========================================================
# SỬA LỖI: ĐÍNH KÈM ROUTER VÀO APP CHÍNH
# =========================================================
app.include_router(api_router)