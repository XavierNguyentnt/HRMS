// src/components/AI_agent/AIAnalysisDisplay.js
import React from "react";
import { Spinner, Card, ListGroup } from "react-bootstrap";
import "./AIAnalysisDisplay.css";

// ====================================================================
// [MỚI] COMPONENT CHUYÊN DỤNG ĐỂ HIỂN THỊ DỮ LIỆU TRỄ HẠN
// ====================================================================
const OverdueTasksDisplay = ({ data }) => {
  if (!data || typeof data !== "object") {
    return <p>{String(data)}</p>;
  }

  const { total_overdue, latest_overdue_task } = data;

  return (
    <ListGroup variant="flush">
      <ListGroup.Item>
        Tổng số: <strong>{total_overdue || 0}</strong> công việc trễ hạn.
      </ListGroup.Item>
      {latest_overdue_task && (
        <ListGroup.Item>
          Nhiệm vụ trễ hạn gần nhất:
          <div className="ms-2">
            - <strong>Tên:</strong> {latest_overdue_task.name} <br />-{" "}
            <strong>Người thực hiện:</strong> {latest_overdue_task.assignee}{" "}
            <br />- <strong>Deadline:</strong>{" "}
            {new Date(latest_overdue_task.deadline).toLocaleDateString("vi-VN")}
          </div>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
};

// ====================================================================
// [MỚI] COMPONENT CHUYÊN DỤNG ĐỂ HIỂN THỊ PHÂN BỔ NHÂN SỰ
// ====================================================================
const WorkloadDisplay = ({ data }) => {
  // `data` ở đây là `cross_project_workload`
  // Kiểm tra xem data và data.tasks_per_project có tồn tại và là một mảng không
  if (!data || !Array.isArray(data.tasks_per_project)) {
    return <p>Không có dữ liệu phân bổ theo dự án.</p>;
  }

  // Bây giờ chúng ta biết chắc chắn `data.tasks_per_project` là một mảng
  return (
    <ListGroup variant="flush">
      <ListGroup.Item>
        <strong>Phân bổ theo dự án:</strong>
      </ListGroup.Item>
      {data.tasks_per_project.map((proj, index) => (
        <ListGroup.Item key={index}>
          - <strong>{proj.name}:</strong> {proj.count} nhiệm vụ
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

// ====================================================================
// [MỚI] COMPONENT CHUYÊN DỤNG ĐỂ HIỂN THỊ ĐỀ XUẤT
// ====================================================================
const SuggestionsDisplay = ({ data }) => {
  if (!data || typeof data !== "object") {
    return <p>{String(data)}</p>;
  }

  // Từ điển để dịch các key từ AI thành câu có nghĩa
  const suggestionMap = {
    automate_task_assignments:
      "Cân nhắc tự động hóa việc gán các công việc lặp lại.",
    implement_deadline_notifications:
      "Triển khai hệ thống cảnh báo khi deadline sắp tới.",
    integrate_with_calendar_apps:
      "Tích hợp với các ứng dụng lịch để đồng bộ deadline.",
  };

  const suggestions = Object.keys(data)
    .filter((key) => data[key] === true && suggestionMap[key])
    .map((key) => suggestionMap[key]);

  if (suggestions.length === 0) {
    return <p>Không có đề xuất tự động nào.</p>;
  }

  return (
    <ListGroup variant="flush">
      {suggestions.map((text, index) => (
        <ListGroup.Item key={index}>💡 {text}</ListGroup.Item>
      ))}
    </ListGroup>
  );
};

// ====================================================================
// COMPONENT CHÍNH
// ====================================================================
export const AIAnalysisDisplay = ({ analysis, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="ai-loading">
        <Spinner animation="border" size="sm" />
        <p className="mb-0 ms-2">
          AI đang phân tích dữ liệu, vui lòng chờ trong giây lát...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-error">
        <p>🚨 **Lỗi:** {error}</p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const {
    overdue_tasks_summary,
    cross_project_workload,
    strategic_suggestions,
  } = analysis;
  const hasData =
    overdue_tasks_summary || cross_project_workload || strategic_suggestions;

  if (!hasData) {
    return (
      <div className="ai-placeholder">
        <p>✅ AI đã phân tích xong. Không có điểm nào đặc biệt cần lưu ý.</p>
      </div>
    );
  }

  return (
    <div className="ai-analysis-results">
      <h4 className="mb-3">Kết quả Phân tích Tổng thể</h4>
      <div className="analysis-grid">
        {overdue_tasks_summary && (
          <Card className="analysis-card overdue">
            <Card.Header as="h5">⚠️ Tóm tắt Công việc Trễ hạn</Card.Header>
            <Card.Body>
              <OverdueTasksDisplay data={overdue_tasks_summary} />
            </Card.Body>
          </Card>
        )}

        {cross_project_workload && (
          <Card className="analysis-card workload">
            <Card.Header as="h5">👥 Phân bổ Nhân sự</Card.Header>
            <Card.Body>
              <WorkloadDisplay data={cross_project_workload} />
            </Card.Body>
          </Card>
        )}

        {strategic_suggestions && (
          <Card className="analysis-card suggestions">
            <Card.Header as="h5">💡 Đề xuất Chiến lược</Card.Header>
            <Card.Body>
              <SuggestionsDisplay data={strategic_suggestions} />
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};
