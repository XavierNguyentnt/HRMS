// src/components/Pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from "react"; // Thêm useCallback
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import {
  FaProjectDiagram,
  FaTasks,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth, ROLES } from "../../../contexts/AuthContext";
import {
  getDashboardStats,
  getMyProgress,
  getMyTasks,
  getProjectAnalysisData,
  getTeamPerformanceData,
} from "../../../services/api";

import StatCard from "../dashboard_components/StatCard";
import MyProgressChart from "../dashboard_components/MyProgressChart";
import MyTasksWidget from "../dashboard_components/MyTasksWidget";
import TomorrowNoteWidget from "../dashboard_components/TomorrowNoteWidget";
import ProjectAnalysisChart from "../dashboard_components/ProjectAnalysisChart";
import TeamPerformance from "../dashboard_components/TeamPerformance";

function DashboardPage() {
  const { user, role } = useAuth();
  // SỬA LỖI: Khởi tạo data với cấu trúc rỗng để tránh lỗi undefined
  const [data, setData] = useState({
    stats: {},
    progress: [],
    tasks: [],
    analysis: [],
    team: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.uid || !role || role === ROLES.UNKNOWN) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Tải các dữ liệu chính trước
      const [stats, progress, tasks, analysis] = await Promise.all([
        getDashboardStats(role, user.uid),
        getMyProgress(role, user.uid),
        getMyTasks(role, user.uid),
        getProjectAnalysisData(role, user.uid),
      ]);

      // Cập nhật state với dữ liệu chính
      setData((prev) => ({ ...prev, stats, progress, tasks, analysis }));

      // Tải dữ liệu team performance riêng nếu có quyền
      if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
        const teamData = await getTeamPerformanceData();
        setData((prev) => ({ ...prev, team: teamData }));
      }
    } catch (err) {
      setError("Không thể tải dữ liệu Dashboard.");
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user || !data) {
    return (
      <Container className="text-center p-5">
        <p>Vui lòng đăng nhập để xem Bảng điều khiển.</p>
      </Container>
    );
  }

  const { stats, progress, tasks, analysis, team } = data;
  const myTotalTasks = Array.isArray(tasks) ? tasks.length : 0;

  console.log("Data passed to MyProgressChart:", progress);

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Bảng điều khiển</h1>

      {/* Hàng thẻ thống kê - ĐÃ THÊM ĐIỀU HƯỚNG */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Tổng số Dự án"
            value={stats.totalProjects}
            icon={<FaProjectDiagram size={30} />}
            color="#5e72e4"
            linkTo="/projects"
          />
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Dự án Hoàn thành"
            value={stats.completedProjects}
            icon={<FaCheckCircle size={30} />}
            color="#2dce89"
            linkTo="/projects"
          />
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Tổng số Nhiệm vụ"
            value={stats.totalTasks}
            icon={<FaTasks size={30} />}
            color="#11cdef"
            linkTo="/tasks?filter=all"
          />
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Nhiệm vụ của tôi"
            value={myTotalTasks} // SỬ DỤNG GIÁ TRỊ MỚI
            icon={<FaExclamationTriangle size={30} />}
            color="#f5365c"
            linkTo="/tasks?filter=my"
          />
        </Col>
      </Row>

      {/* Hàng biểu đồ và My Tasks */}
      <Row>
        <Col lg={8} className="mb-4">
          <ProjectAnalysisChart data={analysis} />
        </Col>
        <Col lg={4} className="mb-4">
          <MyProgressChart data={progress} />
        </Col>
      </Row>

      {/* Hàng Team Performance và Ghi chú */}
      <Row>
        {/* Chỉ render component này khi có dữ liệu team */}
        {(role === ROLES.ADMIN || role === ROLES.MANAGER) &&
          team.length > 0 && (
            <Col lg={8} className="mb-4">
              <TeamPerformance data={team} />
            </Col>
          )}
        <Col
          lg={
            (role === ROLES.ADMIN || role === ROLES.MANAGER) && team.length > 0
              ? 4
              : 12
          }
          className="mb-4">
          <TomorrowNoteWidget />
        </Col>
      </Row>

      {/* Hàng My Tasks riêng */}
      <Row>
        <Col>
          <MyTasksWidget tasks={tasks} />
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardPage;
