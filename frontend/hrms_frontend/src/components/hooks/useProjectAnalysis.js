import { useState } from "react";

export const useProjectAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sửa đổi hàm này để nhận một mảng các ID
  const analyzeProjects = async (projectIds) => {
    if (!projectIds || projectIds.length === 0) {
      setError("Không có dự án nào để phân tích.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Gọi đến endpoint mới
      const response = await fetch("/api/ai/analyze-multiple-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Truyền vào mảng các ID
        body: JSON.stringify({ project_ids: projectIds }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Server responded with an error");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { analysis, isLoading, error, analyzeProjects }; // Đổi tên hàm trả về
};
