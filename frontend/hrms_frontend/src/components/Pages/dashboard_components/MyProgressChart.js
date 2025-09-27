// src/components/Pages/dashboard_components/MyProgressChart.js
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// Mảng màu sắc để biểu đồ trông đẹp hơn
const CHART_COLORS = [
  "#ffc107", // Vàng (Warning)
  "#17a2b8", // Xanh dương (Info)
  "#6c757d", // Xám (Secondary)
  "#fd7e14", // Cam (Orange)
  "#20c997", // Xanh mòng két (Teal)
  "#6610f2", // Chàm (Indigo)
];

const MyProgressChart = ({ data }) => {
  // `data` bây giờ là một mảng: [{ id, name, count }, ...]
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    // Lấy tên các giai đoạn làm nhãn
    labels: data.map((item) => item.name),
    datasets: [
      {
        // Lấy số lượng task làm dữ liệu
        data: data.map((item) => item.count),
        // Lấy màu từ mảng CHART_COLORS, lặp lại nếu cần
        backgroundColor: data.map(
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
        <Card.Title>Tiến độ của tôi</Card.Title>
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
