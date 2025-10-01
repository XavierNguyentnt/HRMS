// src/components/Pages/dashboard_components/MyProgressChart.js
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { cleanStageName } from "../../../util/formatters";

ChartJS.register(ArcElement, Tooltip, Legend);

// Mảng màu sắc để biểu đồ trông đẹp hơn
const CHART_COLORS = [
  "#6c757d", // Vàng (Warning)
  "#17a2b8", // Xanh dương (Info)
  "#20c997", // Xám (Secondary)
  "#fd7e14", // Cam (Orange)
  "#ffc107", // Xanh mòng két (Teal)
  "#6610f2", // Chàm (Indigo)
];

// Stage hợp lệ của task (Odoo 18 project.task.type)
const VALID_TASK_STAGES = [
  "Chuẩn bị",
  "Đang tiến hành",
  "Hoàn thành",
  "Đã huỷ",
];

const MyProgressChart = ({ data }) => {
  // Chỉ giữ lại stage hợp lệ
  const filteredData = data.filter((item) =>
    VALID_TASK_STAGES.includes(cleanStageName(item.name))
  );

  const total = filteredData.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: filteredData.map((item) => cleanStageName(item.name)),
    datasets: [
      {
        data: filteredData.map((item) => item.count),
        backgroundColor: filteredData.map(
          (_, index) => CHART_COLORS[index % CHART_COLORS.length]
        ),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>
          <strong>Tiến độ của tôi</strong>
        </Card.Title>
        <div
          style={{ height: "250px" }}
          className="d-flex justify-content-center align-items-center">
          {total > 0 ? (
            <Doughnut data={chartData} options={options} />
          ) : (
            <p className="text-muted">Chưa có nhiệm vụ nào đang tiến hành.</p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MyProgressChart;
