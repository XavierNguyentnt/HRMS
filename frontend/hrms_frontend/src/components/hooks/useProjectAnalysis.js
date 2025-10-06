// src/hooks/useProjectAnalysis.js
import { useState, useEffect, useRef } from "react";

// Hằng số để cấu hình
const POLLING_INTERVAL = 5000; // 5 giây
const MAX_ATTEMPTS = 60; // Tối đa 60 lần thử (5 phút)

export const useProjectAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dùng useRef để lưu trữ ID của interval, giúp ta có thể xóa nó một cách an toàn
  const pollingIntervalRef = useRef(null);

  // Hàm để dừng việc polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Sử dụng useEffect để tự động dọn dẹp (cleanup) khi component bị unmount
  // Điều này ngăn chặn memory leak và lỗi state update trên component đã unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const analyzeProjects = async (projectIds) => {
    if (!projectIds || projectIds.length === 0) {
      setError("Không có dự án nào để phân tích.");
      return;
    }

    // 1. Reset trạng thái và bắt đầu loading
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    stopPolling(); // Dừng bất kỳ polling cũ nào nếu có

    try {
      // 2. GỌI API BƯỚC 1: Bắt đầu tác vụ và lấy task_id
      const initialResponse = await fetch("/api/ai/analyze-multiple-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_ids: projectIds }),
      });

      if (!initialResponse.ok) {
        const errData = await initialResponse.json();
        throw new Error(
          errData.detail || "Server không phản hồi yêu cầu phân tích"
        );
      }

      const { task_id } = await initialResponse.json();

      if (!task_id) {
        throw new Error("Không nhận được task_id từ server.");
      }

      // 3. GỌI API BƯỚC 2: Bắt đầu polling để kiểm tra trạng thái
      let attempts = 0;
      pollingIntervalRef.current = setInterval(async () => {
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setError("Phân tích mất quá nhiều thời gian. Vui lòng thử lại sau.");
          setIsLoading(false);
          return;
        }

        attempts++;

        try {
          const statusResponse = await fetch(
            `/api/ai/analysis/status/${task_id}`
          );

          // Xử lý trường hợp server trả về lỗi khi đang polling
          if (!statusResponse.ok) {
            // Không throw error ở đây để polling có thể tiếp tục thử lại
            console.warn(
              `Lỗi khi lấy trạng thái (thử lại lần ${attempts}):`,
              statusResponse.statusText
            );
            return;
          }

          const data = await statusResponse.json();

          if (data.status === "completed") {
            // THÀNH CÔNG: Dừng polling, cập nhật kết quả và kết thúc loading
            stopPolling();
            setAnalysis(data.result);
            setIsLoading(false);
          } else if (data.status === "failed") {
            // THẤT BẠI: Dừng polling, báo lỗi và kết thúc loading
            stopPolling();
            setError(data.result?.error || "Tác vụ phân tích đã thất bại.");
            setIsLoading(false);
          }
          // Nếu status vẫn là 'processing', không làm gì cả, chờ lần lặp tiếp theo
        } catch (err) {
          // Lỗi mạng hoặc lỗi nghiêm trọng khác
          stopPolling();
          setError("Lỗi mạng khi đang kiểm tra trạng thái phân tích.");
          setIsLoading(false);
        }
      }, POLLING_INTERVAL);
    } catch (err) {
      // Bắt lỗi của lần gọi API đầu tiên
      setError(err.message);
      setIsLoading(false);
    }
  };

  return { analysis, isLoading, error, analyzeProjects };
};
