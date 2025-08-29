import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  Tabs, // Dùng để tạo notebook
  Tab, // Dùng để tạo các page
  Card,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * Tiện ích chuyển đổi file sang chuỗi Base64 để gửi qua JSON-RPC.
 * @param {File} file - Đối tượng file từ input.
 * @returns {Promise<string>} - Một chuỗi Base64 (chỉ phần data).
 */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

function ProfilePage() {
  const { user, updateUserProfile } = useAuth(); // Lấy user từ context
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Khi component được tải, nếu có user, set data cho form
    if (user) {
      setProfileData(user); // Dữ liệu từ context đã chứa đủ thông tin
      setIsLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Gọi API để lưu thay đổi
    updateUserProfile(profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData(user); // Khôi phục lại dữ liệu gốc
    setIsEditing(false);
  };

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  // Lấy ra quyền sửa đổi từ API
  const canEdit = profileData?.can_edit || false;
  return (
    <Container className="my-4">
      <Card>
        <Card.Body>
          {/* VÙNG THÔNG TIN CHÍNH */}
          <Row className="mb-4 align-items-center">
            <Col md={3} className="text-center">
              <Image
                src={
                  profileData.image_1920
                    ? `data:image/jpeg;base64,${profileData.image_1920}`
                    : "/default-avatar.png"
                }
                roundedCircle
                fluid
                style={{ maxWidth: "150px", border: "3px solid #eee" }}
              />
            </Col>
            <Col md={9}>
              <Form.Group>
                <Form.Control
                  size="lg"
                  type="text"
                  name="name"
                  value={profileData?.name || ""}
                  readOnly={!isEditing || !canEdit}
                  className="h1 bg-transparent border-0 ps-0"
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Chức danh"
                  name="job_title"
                  value={profileData.job_title || ""}
                  readOnly={!isEditing || !canEdit}
                  className="bg-transparent border-0 ps-0 text-muted fs-4"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Dùng Tabs để thay thế <notebook> */}
          <Tabs defaultActiveKey="work_info" id="profile-tabs" className="mb-3">
            {/* Tab 1: Thay thế <page name="public"> */}
            <Tab eventKey="work_info" title="Thông tin công việc">
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email công việc</Form.Label>
                      <Form.Control
                        type="email"
                        value={profileData.work_email || ""}
                        readOnly
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phòng ban</Form.Label>
                      {/* Xử lý trường quan hệ: hiển thị tên */}
                      <Form.Control
                        type="text"
                        value={
                          profileData.department_id
                            ? profileData.department_id[1]
                            : ""
                        }
                        readOnly
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Người quản lý</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          profileData.employee_parent_id
                            ? profileData.employee_parent_id[1]
                            : ""
                        }
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Điện thoại cơ quan</Form.Label>
                      <Form.Control
                        type="text"
                        name="work_phone"
                        value={profileData.work_phone || ""}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Số di động công việc</Form.Label>
                      <Form.Control
                        type="text"
                        name="mobile_phone"
                        value={profileData.mobile_phone || ""}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Địa chỉ nơi làm việc</Form.Label>
                      <Form.Control
                        type="text"
                        name="work_location_id"
                        value={
                          profileData.work_location_id
                            ? profileData.work_location_id[1]
                            : ""
                        }
                        readOnly // <-- Trường này thường không cho sửa trực tiếp, mà là chọn từ danh sách
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Tab>

            <Tab eventKey="private_info" title="Thông Tin Cá Nhân">
              <Form>
                <Row>
                  {/* CỘT BÊN TRÁI */}
                  <Col md={6}>
                    <h5 className="mt-3 mb-3">Địa chỉ & Liên lạc</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Địa chỉ</Form.Label>
                      <Form.Control
                        type="text"
                        name="private_street"
                        value={profileData.private_street || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Địa chỉ 2</Form.Label>
                      <Form.Control
                        type="text"
                        name="private_street2"
                        value={profileData.private_street2 || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Thành phố</Form.Label>
                      <Form.Control
                        type="text"
                        name="private_city"
                        value={profileData.private_city || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Cá Nhân</Form.Label>
                      <Form.Control
                        type="email"
                        name="private_email"
                        value={profileData.private_email || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Điện Thoại Cá Nhân</Form.Label>
                      <Form.Control
                        type="text"
                        name="private_phone"
                        value={profileData.private_phone || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>

                    <h5 className="mt-4 mb-3">Liên Hệ Khẩn Cấp</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên Người Liên Hệ</Form.Label>
                      <Form.Control
                        type="text"
                        name="emergency_contact"
                        value={profileData.emergency_contact || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Số Điện Thoại Khẩn Cấp</Form.Label>
                      <Form.Control
                        type="text"
                        name="emergency_phone"
                        value={profileData.emergency_phone || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                  </Col>

                  {/* CỘT BÊN PHẢI */}
                  <Col md={6}>
                    <h5 className="mt-3 mb-3">Thông Tin Thân Nhân & Học Vấn</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Quốc Tịch</Form.Label>
                      {/* Trường quan hệ Many2one, tạm thời hiển thị tên và không cho sửa */}
                      <Form.Control
                        type="text"
                        value={
                          profileData.employee_country_id
                            ? profileData.employee_country_id[1]
                            : ""
                        }
                        readOnly
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Số CMND/CCCD</Form.Label>
                      <Form.Control
                        type="text"
                        name="identification_id"
                        value={profileData.identification_id || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Giới Tính</Form.Label>
                      <Form.Select
                        name="gender"
                        value={profileData.gender || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || !canEdit}>
                        <option value="">-- Chọn --</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày Sinh</Form.Label>
                      <Form.Control
                        type="date"
                        name="birthday"
                        value={profileData.birthday || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Tình Trạng Hôn Nhân</Form.Label>
                      <Form.Select
                        name="marital"
                        value={profileData.marital || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || !canEdit}>
                        <option value="">-- Chọn --</option>
                        <option value="single">Độc thân</option>
                        <option value="married">Đã kết hôn</option>
                        <option value="cohabitant">Sống chung</option>
                        <option value="widower">Góa</option>
                        <option value="divorced">Ly dị</option>
                      </Form.Select>
                    </Form.Group>

                    {/* Logic ẩn/hiện dựa trên state */}
                    {(profileData.marital === "married" ||
                      profileData.marital === "cohabitant") && (
                      <Form.Group className="mb-3">
                        <Form.Label>Họ Tên Vợ/Chồng</Form.Label>
                        <Form.Control
                          type="text"
                          name="spouse_complete_name"
                          value={profileData.spouse_complete_name || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !canEdit}
                        />
                      </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                      <Form.Label>Bằng Cấp</Form.Label>
                      <Form.Select
                        name="certificate"
                        value={profileData.certificate || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || !canEdit}>
                        <option value="">-- Chọn --</option>
                        <option value="graduate">Tốt nghiệp Phổ thông</option>
                        <option value="bachelor">Cử nhân</option>
                        <option value="master">Thạc sĩ</option>
                        <option value="doctor">Tiến sĩ</option>
                        <option value="other">Khác</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Lĩnh Vực Học</Form.Label>
                      <Form.Control
                        type="text"
                        name="study_field"
                        value={profileData.study_field || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Trường Học</Form.Label>
                      <Form.Control
                        type="text"
                        name="study_school"
                        value={profileData.study_school || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Tab>

            {/* Tab 3: Thay thế <page name="hr_settings"> */}
            <Tab eventKey="hr_settings" title="Cài Đặt Nhân Sự">
              <Form>
                <Row>
                  {/* CỘT BÊN TRÁI: STATUS */}
                  <Col md={6}>
                    <h5 className="mt-3 mb-3">Trạng Thái</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại nhân viên</Form.Label>
                      <Form.Select
                        name="employee_type"
                        value={profileData.employee_type || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing || !canEdit}>
                        <option value="">-- Chọn --</option>
                        <option value="employee">Nhân viên</option>
                        <option value="contractor">
                          Nhà thầu (Contractor)
                        </option>
                        <option value="freelancer">
                          Làm việc tự do (Freelancer)
                        </option>
                        <option value="intern">Thực tập sinh</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* CỘT BÊN PHẢI: ATTENDANCE */}
                  <Col md={6}>
                    <h5 className="mt-3 mb-3">Chấm Công</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Mã PIN</Form.Label>
                      <Form.Control
                        type="text"
                        name="pin"
                        placeholder="Mã PIN để chấm công"
                        value={profileData.pin || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Mã Vạch</Form.Label>
                      <Form.Control
                        type="text"
                        name="barcode"
                        placeholder="Mã vạch định danh nhân viên"
                        value={profileData.barcode || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Tab>
          </Tabs>

          {/* Nút bấm điều khiển */}
          <div className="text-end mt-4">
            {canEdit && !isEditing && (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                Chỉnh Sửa
              </Button>
            )}
            {canEdit && isEditing && (
              <>
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={handleCancel}>
                  Hủy
                </Button>
                <Button variant="success" onClick={handleSave}>
                  Lưu Thay Đổi
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProfilePage;
