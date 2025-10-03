// src/components/AI_agent/AIAnalysisDisplay.js
import React from "react";

// Giả sử bạn có component Spinner cho hiệu ứng tải
import { Spinner } from "react-bootstrap";

export const AIAnalysisDisplay = ({ analysis, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="ai-loading">
        <Spinner /> <p>AI đang phân tích dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-error">
        <p>🚨 Lỗi: {error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="ai-placeholder">
        <p>Nhấn nút để bắt đầu phân tích dự án bằng AI.</p>
      </div>
    );
  }

  // Khi có dữ liệu, hiển thị một cách trực quan
  return (
    <div className="ai-analysis-results">
      {analysis.overdue_tasks && analysis.overdue_tasks.length > 0 && (
        <div className="card overdue">
          <h4>Công việc trễ hạn</h4>
          <ul>
            {analysis.overdue_tasks.map((task) => (
              <li key={task.task_name}>
                {task.task_name} (Deadline: {task.deadline}) -{" "}
                <strong>{task.assigned_to}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.workload_analysis && (
        <div className="card workload">
          <h4>Phân bổ nhân sự</h4>
          <ul>
            {analysis.workload_analysis.map((member) => (
              <li key={member.member_name}>
                {member.member_name}: <strong>{member.task_count}</strong> công
                việc
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions && (
        <div className="card suggestions">
          <h4>💡 Đề xuất từ AI</h4>
          <ul>
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
