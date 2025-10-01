// src/components/Pages/dashboard_components/WeeklyActivityChart.js
import React from "react";
import { Line } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyActivityChart = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Nhiệm vụ mới",
        data: data.map((d) => d.created),
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        tension: 0.3,
      },
      {
        label: "Nhiệm vụ hoàn thành",
        data: data.map((d) => d.completed),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
      },
    ],
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>
          <strong>Hoạt động trong tuần</strong>
        </Card.Title>
        <div style={{ height: "250px" }}>
          <Line
            options={{ maintainAspectRatio: false, responsive: true }}
            data={chartData}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default WeeklyActivityChart;
