import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Form,
  Button, // MỚI: Thêm Button
  Alert, // MỚI: Thêm Alert để báo lỗi
} from "react-bootstrap";
import { useSearchParams, Link } from "react-router-dom"; // MỚI: Thêm Link
import * as odooApi from "../../../services/api";
import Avatar from "../../shared/Avatar";

const PAGE_SIZE = 20; // Mỗi lần tải 20 nhân viên

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Dùng cho lần tải đầu tiên
  const [isPageLoading, setIsPageLoading] = useState(false); // Dùng cho các lần "Tải thêm"
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const deptId = searchParams.get("dept_id");
  const deptName = searchParams.get("dept_name");

  // SỬA ĐỔI QUAN TRỌNG:
  // useEffect này chỉ chạy khi người dùng thay đổi bộ lọc (tìm kiếm hoặc đổi phòng ban)
  // Nhiệm vụ của nó là reset lại trạng thái để bắt đầu một lượt tải mới.
  useEffect(() => {
    setSearchTerm(""); // Xóa tìm kiếm cũ khi đổi phòng ban
    setPage(1);
    setEmployees([]); // Xóa danh sách nhân viên cũ
    setHasMore(true);
  }, [deptId]); // Chỉ phụ thuộc vào deptId

  // useEffect này chịu trách nhiệm tải dữ liệu
  useEffect(() => {
    // Chỉ chạy khi còn dữ liệu để tải
    if (!hasMore) return;

    const loadEmployees = async () => {
      page === 1 ? setIsLoading(true) : setIsPageLoading(true);
      setError(null);

      try {
        let domain = [];
        if (searchTerm) {
          domain.push(["name", "ilike", searchTerm]);
        }
        if (deptId) {
          domain.push(["department_id", "=", parseInt(deptId, 10)]);
        }

        const data = await odooApi.fetchEmployees({
          domain,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });

        // SỬA LỖI QUAN TRỌNG NHẤT:
        // Nếu là trang 1, thay thế hoàn toàn. Nếu không, nối vào mảng cũ.
        setEmployees((prev) => (page === 1 ? data : [...prev, ...data]));

        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        setError("Không thể tải danh sách nhân viên. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    };

    // Áp dụng debounce cho việc tìm kiếm
    const timerId = setTimeout(loadEmployees, searchTerm ? 500 : 0);
    return () => clearTimeout(timerId);
  }, [page, searchTerm, deptId, hasMore]); // Phụ thuộc vào các giá trị này để tải lại

  const handleLoadMore = () => {
    if (!isPageLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // Khi người dùng gõ tìm kiếm, reset lại trang về 1
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset về trang 1
    setEmployees([]); // Xóa kết quả cũ ngay lập tức
    setHasMore(true);
  };

  // SỬA LỖI KEY: Cung cấp một key duy nhất hơn trong trường hợp dữ liệu API có thể bị trùng lặp tạm thời
  // Bằng cách kết hợp id và index.
  const renderEmployeeList = () => {
    if (isLoading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      );
    }

    if (employees.length > 0) {
      return (
        <Row>
          {employees.map((emp, index) => (
            <Col
              md={4}
              lg={3}
              xl={2}
              key={`${emp.id}-${index}`}
              className="mb-4">
              <Link to={`/profile/${emp.id}`} className="text-decoration-none">
                <Card className="h-100 text-center employee-card">
                  <Card.Body>
                    <Avatar
                      src={
                        emp.image_128
                          ? `data:image/jpeg;base64,${emp.image_128}`
                          : null
                      }
                      altText={emp.name}
                      size={90}
                      className="mb-3"
                      style={{ border: "3px solid #eee" }}
                    />
                    <Card.Title as="h6" className="fw-bold text-dark">
                      {emp.name}
                    </Card.Title>
                    <Card.Text className="text-muted small">
                      {emp.job_title}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      );
    }

    // Chỉ hiển thị khi không loading và không có lỗi
    return !error && <p className="ms-3">Không tìm thấy nhân viên nào.</p>;
  };

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">
        {deptName ? `Nhân viên: ${deptName}` : "Danh sách Nhân viên"}
      </h1>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Tìm kiếm nhân viên theo tên..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Col>
      </Row>

      {error && !isLoading && <Alert variant="danger">{error}</Alert>}

      {renderEmployeeList()}

      <div className="text-center mt-3">
        {isPageLoading && <Spinner animation="border" size="sm" />}
        {hasMore && !isLoading && !isPageLoading && (
          <Button onClick={handleLoadMore}>Tải thêm</Button>
        )}
      </div>
    </Container>
  );
}

export default EmployeesPage;
