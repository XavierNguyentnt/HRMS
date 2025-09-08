import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  Tabs,
  Tab,
  Card,
  Spinner,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import { useAuth } from "../../../contexts/AuthContext";
import * as odooApi from "../../../services/odooAPI";

function ProfilePage() {
  const {
    user,
    handleUpdateProfile,
    isUpdateLoading,
    updateSuccess,
    updateError,
  } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // STATE MỚI: Để lưu trữ danh sách kỹ năng đã xử lý
  const [skills, setSkills] = useState({});
  const [isSkillsLoading, setIsSkillsLoading] = useState(true);

  useEffect(() => {
    const loadProfileAndSkills = async () => {
      if (user) {
        setProfileData(user);
        setIsLoading(false);

        // BƯỚC 1: Kiểm tra xem nhân viên có ID kỹ năng nào không
        if (user.employee_skill_ids && user.employee_skill_ids.length > 0) {
          try {
            // BƯỚC 2: Gọi API mới để lấy chi tiết kỹ năng
            const skillDetails = await odooApi.fetchEmployeeSkills(
              user.employee_skill_ids
            );

            // BƯỚC 3: Nhóm các kỹ năng theo loại (vd: Ngôn ngữ, Lập trình)
            const groupedSkills = skillDetails.reduce((acc, skill) => {
              const skillTypeName = skill.skill_type_id[1]; // Lấy tên loại kỹ năng
              if (!acc[skillTypeName]) {
                acc[skillTypeName] = [];
              }
              acc[skillTypeName].push(skill);
              return acc;
            }, {});

            setSkills(groupedSkills);
          } catch (error) {
            console.error("Không thể tải kỹ năng:", error);
          } finally {
            setIsSkillsLoading(false);
          }
        } else {
          setIsSkillsLoading(false);
        }
      }
    };

    loadProfileAndSkills();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Chỉ lấy những trường đã thay đổi để gửi đi, tối ưu request
    const changedData = {};
    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== user[key]) {
        changedData[key] = profileData[key];
      }
    });

    if (Object.keys(changedData).length > 0) {
      await handleUpdateProfile(changedData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData(user);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  const canEdit = true;

  return (
    <Container className="my-4">
      <Card>
        <Card.Body>
          {/* THÔNG BÁO CẬP NHẬT */}
          {updateSuccess && (
            <Alert variant="success">Cập nhật thông tin thành công!</Alert>
          )}
          {updateError && <Alert variant="danger">{updateError}</Alert>}

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
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  border: "3px solid #eee",
                }}
              />
            </Col>
            <Col md={9}>
              <Form.Group>
                <Form.Control
                  size="lg"
                  type="text"
                  name="name"
                  value={profileData?.name || ""}
                  onChange={handleInputChange}
                  readOnly={!isEditing || !canEdit}
                  className="h1 bg-transparent border-0 ps-0 fw-bold"
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Chức danh"
                  name="job_title"
                  value={profileData.job_title || ""}
                  onChange={handleInputChange}
                  readOnly={!isEditing || !canEdit}
                  className="bg-transparent border-0 ps-0 text-muted fs-4"
                />
              </Form.Group>
            </Col>
          </Row>

          <Tabs defaultActiveKey="work_info" id="profile-tabs" className="mb-3">
            {/* Tab 1: Thông tin công việc */}
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
                    <Form.Group className="mb-3">
                      <Form.Label>Người hướng dẫn (Coach)</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          profileData.coach_id ? profileData.coach_id[1] : ""
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
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Số di động công việc</Form.Label>
                      <Form.Control
                        type="text"
                        name="mobile_phone"
                        value={profileData.mobile_phone || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing || !canEdit}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Địa chỉ nơi làm việc</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          profileData.work_location_id
                            ? profileData.work_location_id[1]
                            : ""
                        }
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Tab>

            {/* Tab 2: Thông tin cá nhân */}
            <Tab eventKey="private_info" title="Thông Tin Cá Nhân">
              <Form>
                <Row>
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
                  <Col md={6}>
                    <h5 className="mt-3 mb-3">Thân nhân & Học vấn</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Quốc Tịch</Form.Label>
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
                      <Form.Label>Số Hộ chiếu</Form.Label>
                      <Form.Control
                        type="text"
                        name="passport_id"
                        value={profileData.passport_id || ""}
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

            <Tab eventKey="skills_resume" title="Kỹ năng & Sơ yếu lý lịch">
              <Row className="p-3">
                <Col md={12}>
                  <h4>Kỹ năng</h4>
                  {isSkillsLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : Object.keys(skills).length > 0 ? (
                    // Lặp qua từng nhóm kỹ năng (vd: "Languages")
                    Object.entries(skills).map(([skillType, skillList]) => (
                      <div key={skillType} className="mb-4">
                        <h5 className="text-muted">{skillType}</h5>
                        {/* Lặp qua từng kỹ năng trong nhóm */}
                        {skillList.map((skill) => (
                          <div key={skill.id} className="mb-3">
                            <div className="d-flex justify-content-between">
                              <span>{skill.skill_id[1]}</span>{" "}
                              {/* Tên kỹ năng, vd: "English" */}
                              <small>{skill.skill_level_id[1]}</small>{" "}
                              {/* Tên cấp độ, vd: "A2 (40%)" */}
                            </div>
                            <ProgressBar
                              now={skill.level_progress}
                              label={`${skill.level_progress}%`}
                              variant="primary"
                            />
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p>Chưa có thông tin kỹ năng nào.</p>
                  )}
                </Col>
              </Row>
            </Tab>

            {/* Tab 3: Cài đặt nhân sự */}
            <Tab eventKey="hr_settings" title="Cài Đặt Nhân Sự">
              <Form>
                <Row>
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
                <Button
                  variant="success"
                  onClick={handleSave}
                  disabled={isUpdateLoading}>
                  {isUpdateLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{" "}
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu Thay Đổi"
                  )}
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
