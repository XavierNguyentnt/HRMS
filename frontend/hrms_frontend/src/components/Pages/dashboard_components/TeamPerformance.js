// src/components/Pages/dashboard_components/TeamPerformance.js
import React from "react";
import { Card, Table, ProgressBar } from "react-bootstrap";

// THÊM GIÁ TRỊ MẶC ĐỊNH Ở ĐÂY
const TeamPerformance = ({ data = [] }) => {
  // Sắp xếp dữ liệu để người có nhiều task nhất lên đầu
  const sortedData = [...data].sort((a, b) => b.total - a.total);

  return (
    <Card className="h-100">
      <Card.Header>
        <Card.Title>Hiệu suất Nhóm</Card.Title>
      </Card.Header>
      <Card.Body>
        {/* Xử lý trường hợp không có dữ liệu */}
        {data.length === 0 ? (
          <p className="text-muted text-center pt-3">
            Không có dữ liệu hiệu suất để hiển thị.
          </p>
        ) : (
          <Table striped hover responsive="sm" size="sm">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th className="text-center">Hoàn thành</th>
                <th className="text-center">Tổng số</th>
                <th style={{ minWidth: "150px" }}>Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((member) => {
                const completionRate =
                  member.total > 0
                    ? Math.round((member.completed / member.total) * 100)
                    : 0;
                return (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td className="text-center">{member.completed}</td>
                    <td className="text-center">{member.total}</td>
                    <td>
                      <ProgressBar
                        now={completionRate}
                        label={`${completionRate}%`}
                        variant={
                          completionRate > 80
                            ? "success"
                            : completionRate > 50
                            ? "info"
                            : "warning"
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default TeamPerformance;
