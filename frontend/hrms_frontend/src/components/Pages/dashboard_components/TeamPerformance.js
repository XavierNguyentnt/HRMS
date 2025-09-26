// src/components/Pages/dashboard_components/TeamPerformance.js
import React from "react";
import { Card, Table, Image, ProgressBar } from "react-bootstrap";

const TeamPerformance = ({ data }) => {
  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>Hiệu suất Nhóm</Card.Title>
        <Table responsive hover className="mt-3">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Hoàn thành / Tổng</th>
              <th>Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter((u) => u.total > 0)
              .map((user) => {
                const performance =
                  user.total > 0
                    ? Math.round((user.completed / user.total) * 100)
                    : 0;
                return (
                  <tr key={user.id}>
                    <td>
                      <Image
                        src={`${process.env.REACT_APP_ODOO_BASE_URL}/web/image/res.users/${user.id}/avatar_128`}
                        roundedCircle
                        width="30"
                        height="30"
                        className="me-2"
                      />
                      {user.name}
                    </td>
                    <td>
                      {user.completed} / {user.total}
                    </td>
                    <td>
                      <ProgressBar
                        now={performance}
                        label={`${performance}%`}
                        variant={
                          performance > 70
                            ? "success"
                            : performance > 40
                            ? "warning"
                            : "danger"
                        }
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default TeamPerformance;
