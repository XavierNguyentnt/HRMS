// src/components/Pages/dashboard_components/ProjectStatusChart.js
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card } from "react-bootstrap";

ChartJS.register(ArcElement, Tooltip, Legend);

const ProjectStatusChart = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.stage_id[1]),
    datasets: [
      {
        label: "# of Projects",
        data: data.map((d) => d.stage_id_count),
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 99, 132, 0.8)",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>Phân bổ Dự án</Card.Title>
        <Doughnut data={chartData} />
      </Card.Body>
    </Card>
  );
};

export default ProjectStatusChart;
