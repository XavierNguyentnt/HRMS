// src/components/Pages/dashboard_components/MyProgressChart.js
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const MyProgressChart = ({ data }) => {
  const total = data.completed + data.inProgress + data.notStarted;
  const chartData = {
    labels: ["Hoàn thành", "Đang tiến hành", "Chưa bắt đầu"],
    datasets: [
      {
        data: [data.completed, data.inProgress, data.notStarted],
        backgroundColor: ["#28a745", "#ffc107", "#6c757d"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };
  const options = { responsive: true, maintainAspectRatio: false };

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
            <p>Chưa có nhiệm vụ nào.</p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MyProgressChart;
