// src/components/Pages/dashboard_components/ProjectAnalysisChart.js
import React from "react";
import { Bar } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProjectAnalysisChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="h-100">
        <Card.Body className="d-flex justify-content-center align-items-center">
          <p className="text-muted">Không có dữ liệu để phân tích.</p>
        </Card.Body>
      </Card>
    );
  }
  const chartData = {
    labels: data.map((d) => format(new Date(d.year, d.month), "MMM")),
    datasets: [
      {
        label: "Dự án mới",
        data: data.map((d) => d.created),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Dự án hoàn thành",
        data: data.map((d) => d.completed),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>
          <strong>Phân tích Dự án</strong>
        </Card.Title>
        <div style={{ height: "300px" }}>
          <Bar
            data={chartData}
            options={{ maintainAspectRatio: false, responsive: true }}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProjectAnalysisChart;
