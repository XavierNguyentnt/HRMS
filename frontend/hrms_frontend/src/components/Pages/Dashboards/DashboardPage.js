// src/components/Pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from "react";
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
  getWeeklyTaskActivity,
} from "../../../services/api";

import StatCard from "../dashboard_components/StatCard";
import MyProgressChart from "../dashboard_components/MyProgressChart";
import MyTasksWidget from "../dashboard_components/MyTasksWidget";
import TomorrowNoteWidget from "../dashboard_components/TomorrowNoteWidget";
import ProjectAnalysisChart from "../dashboard_components/ProjectAnalysisChart";
import TeamPerformance from "../dashboard_components/TeamPerformance";
import WeeklyActivityChart from "../dashboard_components/WeeklyActivityChart";

function DashboardPage() {
  const { user, role } = useAuth();
  const [data, setData] = useState(null); // <-- Khởi tạo là null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    // Chỉ thực thi khi có user và role hợp lệ
    if (!user?.uid || !role || role === ROLES.UNKNOWN) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [stats, progress, tasks, analysis, team, weeklyActivity] =
        await Promise.all([
          getDashboardStats(role, user.uid),
          getMyProgress(role, user.uid),
          getMyTasks(role, user.uid),
          getProjectAnalysisData(role, user.uid),
          role === ROLES.ADMIN || role === ROLES.MANAGER
            ? getTeamPerformanceData()
            : Promise.resolve([]),
          getWeeklyTaskActivity(role, user.uid),
        ]);
      setData({ stats, progress, tasks, analysis, team, weeklyActivity });
    } catch (err) {
      setError("Không thể tải dữ liệu Dashboard.");
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, role]); // Phụ thuộc vào user và role

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

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!user) {
    return (
      <Container className="text-center p-5">
        <p>Vui lòng đăng nhập để xem Bảng điều khiển.</p>
      </Container>
    );
  }

  // Cung cấp giá trị mặc định an toàn khi destructuring
  const {
    stats = {},
    progress = [],
    tasks = [],
    analysis = [],
    team = [],
    weeklyActivity = [],
  } = data || {}; // Sử dụng || {} để tránh lỗi nếu data là null

  const myTotalTasks = tasks.length;

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Bảng điều khiển</h1>

      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Tổng số Dự án"
            value={stats.totalProjects || 0}
            icon={<FaProjectDiagram size={30} />}
            color="#5e72e4"
            linkTo="/projects"
          />
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Dự án Hoàn thành"
            value={stats.completedProjects || 0}
            icon={<FaCheckCircle size={30} />}
            color="#2dce89"
            linkTo="/projects"
          />
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Tổng số Nhiệm vụ"
            value={stats.totalTasks || 0}
            icon={<FaTasks size={30} />}
            color="#11cdef"
            linkTo="/tasks?filter=all"
          />
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <StatCard
            title="Nhiệm vụ của tôi"
            value={myTotalTasks}
            icon={<FaExclamationTriangle size={30} />}
            color="#f5365c"
            linkTo="/tasks?filter=my"
          />
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="mb-4">
          <ProjectAnalysisChart data={analysis} />
        </Col>
      </Row>
      <Row>
        <Col lg={6} className="mb-4">
          <MyProgressChart data={progress} />
        </Col>
        <Col lg={6} className="mb-4">
          <WeeklyActivityChart data={weeklyActivity} />
        </Col>
      </Row>

      <Row>
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

      <Row>
        <Col>
          <MyTasksWidget tasks={tasks} />
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardPage;
