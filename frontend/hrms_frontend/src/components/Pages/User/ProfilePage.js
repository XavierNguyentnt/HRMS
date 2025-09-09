import React, { useState, useEffect, useCallback } from "react";
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
  Modal,
} from "react-bootstrap";
import { useAuth } from "../../../contexts/AuthContext";
import * as odooApi from "../../../services/odooAPI";
import { FaTrash, FaPlusCircle } from "react-icons/fa";

function ProfilePage() {
  const {
    user,
    handleUpdateProfile,
    isUpdateLoading,
    updateSuccess,
    updateError,
  } = useAuth();

  //---State chỉnh sửa kỹ năng ---
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // --- State cho Kỹ năng ---
  const [skills, setSkills] = useState({});
  const [isSkillsLoading, setIsSkillsLoading] = useState(true);

  // --- State cho Kinh nghiệm làm việc ---
  const [resumeLines, setResumeLines] = useState([]);
  const [isResumeLoading, setIsResumeLoading] = useState(true);

  // --- State cho Modal "Thêm Kỹ năng" ---
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillTypes, setSkillTypes] = useState([]);
  const [skillsForType, setSkillsForType] = useState([]);
  const [levelsForSkill, setLevelsForSkill] = useState([]);
  const [newSkillData, setNewSkillData] = useState({
    skill_type_id: "",
    skill_id: "",
    skill_level_id: "",
  });
  const [skillToUpdateId, setSkillToUpdateId] = useState(null);

  //State cho Modal chỉnh sửa "Kinh nghiệm làm việc"
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState(null);
  const [resumeFormData, setResumeFormData] = useState({
    name: "",
    date_start: "",
    date_end: "",
    description: "",
  });

  // --- State sửa quốc gia/ tỉnh ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    const loadDropdowns = async () => {
      const countryList = await odooApi.fetchCountries();
      setCountries(countryList);

      if (user?.country_id?.[0]) {
        const stateList = await odooApi.fetchStatesByCountry(
          user.country_id[0]
        );
        setStates(stateList);
      }
    };
    loadDropdowns();
  }, [user]);

  const handleCountryChange = async (e) => {
    const countryId = parseInt(e.target.value) || null;
    setProfileData((prev) => ({ ...prev, country_id: countryId }));

    if (countryId) {
      const stateList = await odooApi.fetchStatesByCountry(countryId);
      setStates(stateList);
      // reset state khi đổi country
      setProfileData((prev) => ({ ...prev, private_state_id: "" }));
    } else {
      setStates([]);
    }
  };

  const handleStateChange = (e) => {
    const stateId = parseInt(e.target.value) || null;
    setProfileData((prev) => ({ ...prev, private_state_id: stateId }));
  };

  //Mở Modal khi click vào kỹ năng
  const handleEditResume = (resume) => {
    setResumeToEdit(resume.id);
    setResumeFormData({
      name: resume.name || "",
      date_start: resume.date_start || "",
      date_end: resume.date_end || "",
      description: resume.description || "",
    });
    setShowResumeModal(true);
  };
  //Hàm xử lý lưu chỉnh sửa kỹ năng
  const handleSaveResume = async () => {
    try {
      if (resumeToEdit) {
        const safeDescription = resumeFormData.description
          .trim()
          .startsWith("<p>")
          ? resumeFormData.description
          : `<p>${resumeFormData.description}</p>`;

        // cập nhật
        await odooApi.updateResumeLine(resumeToEdit, {
          ...resumeFormData,
          description: safeDescription,
        });
      } else {
        // thêm mới (bắt buộc gắn employee_id)
        await odooApi.addResumeLine({
          employee_id: user.id,
          ...resumeFormData,
        });
      }
      setShowResumeModal(false);
      setResumeToEdit(null);
      forceUpdateData();
    } catch (error) {
      console.error("Lỗi khi lưu resume:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  // === Dữ liệu và logic ===
  const forceUpdateData = useCallback(async () => {
    // Hàm này sẽ được gọi sau khi thêm/xóa để làm mới toàn bộ dữ liệu
    // bằng cách giả lập một lần cập nhật profile, trigger AuthContext làm mới user
    await handleUpdateProfile({});
  }, [handleUpdateProfile]);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setProfileData({
          ...user,
          country_id: user.country_id ? user.country_id[0] : "",
          private_state_id: user.private_state_id
            ? user.private_state_id[0]
            : "",
        });
        setIsLoading(false);

        // Tải Kỹ năng
        if (user.employee_skill_ids?.length > 0) {
          const details = await odooApi.fetchEmployeeSkills(
            user.employee_skill_ids
          );
          const grouped = details.reduce((acc, s) => {
            const typeName = s.skill_type_id[1];
            if (!acc[typeName]) acc[typeName] = [];
            acc[typeName].push(s);
            return acc;
          }, {});
          setSkills(grouped);
        }
        setIsSkillsLoading(false);

        // Tải Kinh nghiệm
        if (user.resume_line_ids?.length > 0) {
          const lines = await odooApi.fetchEmployeeResumeLines(
            user.resume_line_ids
          );
          setResumeLines(lines);
        }
        setIsResumeLoading(false);
      }
    };
    loadData();
  }, [user]);

  // === Xử lý cho Modal Thêm Kỹ năng ===
  const handleShowSkillModal = async () => {
    const types = await odooApi.fetchSkillTypes();
    setSkillTypes(types);
    setShowSkillModal(true);
  };

  const handleSkillTypeChange = async (typeId) => {
    // 1. Reset tất cả các state con
    setNewSkillData({
      skill_type_id: typeId,
      skill_id: "",
      skill_level_id: "",
    });
    setSkillsForType([]);
    setLevelsForSkill([]);

    // 2. Nếu có chọn một loại, tải đồng thời cả Tên kỹ năng và Cấp độ
    if (typeId) {
      const id = parseInt(typeId);
      const [skills, levels] = await Promise.all([
        odooApi.fetchSkillsByType(id),
        odooApi.fetchSkillLevelsByType(id), // Logic đúng
      ]);
      setSkillsForType(skills);
      setLevelsForSkill(levels);
    }
  };

  const handleSkillChange = async (skillId) => {
    // Reset lựa chọn cấp độ
    setNewSkillData((prev) => ({
      ...prev,
      skill_id: skillId,
      skill_level_id: "",
    }));
    setSkillToUpdateId(null); // Reset ID cần update

    if (skillId) {
      const parsedSkillId = parseInt(skillId);

      // Kiểm tra xem kỹ năng vừa chọn đã tồn tại trong danh sách kỹ năng của user chưa
      const allSkills = Object.values(skills).flat();
      const existingSkill = allSkills.find(
        (s) => s.skill_id[0] === parsedSkillId
      );

      if (existingSkill) {
        // Nếu đã tồn tại, lưu lại ID của dòng hr.employee.skill để CẬP NHẬT
        setSkillToUpdateId(existingSkill.id);
        // Đồng thời gán sẵn skill_level_id hiện tại để hiển thị
        setNewSkillData((prev) => ({
          ...prev,
          skill_level_id: existingSkill.skill_level_id[0],
        }));
      }
    }
  };

  const handleEditSkill = async (skill) => {
    // Tải toàn bộ skill type (để populate dropdown)
    const types = await odooApi.fetchSkillTypes();
    setSkillTypes(types);

    // Tải skills và levels theo type hiện tại
    const [skills, levels] = await Promise.all([
      odooApi.fetchSkillsByType(skill.skill_type_id[0]),
      odooApi.fetchSkillLevelsByType(skill.skill_type_id[0]),
    ]);
    setSkillsForType(skills);
    setLevelsForSkill(levels);

    // Gán dữ liệu skill đang edit
    setNewSkillData({
      skill_type_id: skill.skill_type_id[0],
      skill_id: skill.skill_id[0],
      skill_level_id: skill.skill_level_id[0],
    });
    setSkillToUpdateId(skill.id);

    // Mở modal
    setShowSkillModal(true);
  };

  const handleSaveNewSkill = async () => {
    if (
      !newSkillData.skill_type_id ||
      !newSkillData.skill_id ||
      !newSkillData.skill_level_id
    ) {
      alert("Vui lòng chọn đầy đủ loại, kỹ năng và cấp độ.");
      return;
    }

    const newLevelId = parseInt(newSkillData.skill_level_id);

    try {
      if (skillToUpdateId) {
        // TRƯỜNG HỢP 1: CẬP NHẬT kỹ năng đã có
        await odooApi.updateEmployeeSkill(skillToUpdateId, {
          skill_level_id: newLevelId,
        });
      } else {
        // TRƯỜNG HỢP 2: THÊM MỚI kỹ năng chưa có
        await odooApi.addEmployeeSkill({
          employee_id: user.id,
          skill_id: parseInt(newSkillData.skill_id),
          skill_level_id: newLevelId,
          skill_type_id: parseInt(newSkillData.skill_type_id), // BẮT BUỘC
        });
      }
      setShowSkillModal(false);
      forceUpdateData(); // Tải lại toàn bộ dữ liệu để đồng bộ
    } catch (error) {
      console.error("Lỗi khi lưu kỹ năng:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  const handleDeleteSkill = async (skillLineId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) {
      await odooApi.deleteEmployeeSkill(skillLineId);
      forceUpdateData(); // Tải lại dữ liệu
    }
  };

  const handleDeleteResume = async (resumeLineId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kinh nghiệm này?")) {
      await odooApi.deleteResumeLine(resumeLineId);
      forceUpdateData(); // Tải lại dữ liệu
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const changedData = {};
    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== user[key]) {
        changedData[key] = profileData[key];
      }
    });

    // giữ nguyên tên field đúng với Odoo
    if (changedData.country_id) {
      changedData.country_id = parseInt(changedData.country_id);
    }
    if (changedData.private_state_id) {
      changedData.private_state_id = parseInt(changedData.private_state_id);
    }

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
    <>
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

            <Tabs
              defaultActiveKey="work_info"
              id="profile-tabs"
              className="mb-3">
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
                            profileData.parent_id
                              ? profileData.parent_id[1]
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
                        <Form.Label>Số nhà, tên đường</Form.Label>
                        <Form.Control
                          type="text"
                          name="private_street"
                          value={profileData.private_street || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !canEdit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Xã/ Phường</Form.Label>
                        <Form.Control
                          type="text"
                          name="private_street2"
                          value={profileData.private_street2 || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !canEdit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Tỉnh / Thành phố</Form.Label>
                        <Form.Select
                          name="private_state_id"
                          value={profileData.private_state_id || ""}
                          onChange={handleStateChange}
                          disabled={
                            !isEditing || !canEdit || states.length === 0
                          }>
                          <option value="">-- Chọn Tỉnh/Thành --</option>
                          {states.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </Form.Select>
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
                        <Form.Select
                          name="country_id"
                          value={profileData.country_id || ""}
                          onChange={handleCountryChange}
                          disabled={!isEditing || !canEdit}>
                          <option value="">-- Chọn Quốc gia --</option>
                          {countries.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Form.Select>
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
                  {/* === PHẦN KỸ NĂNG === */}
                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>Kỹ năng</h4>
                      <Button variant="link" onClick={handleShowSkillModal}>
                        <FaPlusCircle /> Thêm
                      </Button>
                    </div>
                    {isSkillsLoading ? (
                      <Spinner size="sm" />
                    ) : Object.keys(skills).length > 0 ? (
                      Object.entries(skills).map(([type, list]) => (
                        <div key={type} className="mb-4">
                          <h5 className="text-muted">{type}</h5>
                          {list.map((skill) => (
                            <div key={skill.id} className="mb-3">
                              <div className="d-flex justify-content-between">
                                <span
                                  className="cursor-pointer text-primary"
                                  onClick={() => handleEditSkill(skill)}>
                                  {skill.skill_id[1]}
                                </span>
                                <small className="d-flex align-items-center">
                                  {skill.skill_level_id[1]}
                                  <FaTrash
                                    className="ms-2 text-danger cursor-pointer"
                                    onClick={() => handleDeleteSkill(skill.id)}
                                  />
                                </small>
                              </div>
                              <ProgressBar
                                now={skill.level_progress}
                                label={`${skill.level_progress}%`}
                              />
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <p>Chưa có thông tin kỹ năng.</p>
                    )}
                  </Col>

                  {/* === PHẦN SƠ YẾU LÝ LỊCH === */}
                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>Kinh nghiệm</h4>
                      {/* Nút thêm kinh nghiệm có thể được thêm ở đây */}
                    </div>
                    {isResumeLoading ? (
                      <Spinner size="sm" />
                    ) : resumeLines.length > 0 ? (
                      resumeLines.map((line) => (
                        <div
                          key={line.id}
                          className="mb-3 border-bottom pb-2 cursor-pointer"
                          onClick={() => handleEditResume(line)}>
                          <div className="d-flex justify-content-between">
                            <h6 className="fw-bold">{line.name}</h6>
                            <FaTrash
                              className="text-danger cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation(); // tránh mở modal khi bấm xoá
                                handleDeleteResume(line.id);
                              }}
                            />
                          </div>
                          <p className="text-muted small">
                            {line.date_start} - {line.date_end || "Hiện tại"}
                          </p>
                          <p
                            className="resume-description"
                            dangerouslySetInnerHTML={{
                              __html: line.description || "",
                            }}></p>
                        </div>
                      ))
                    ) : (
                      <p>Chưa có kinh nghiệm làm việc.</p>
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

      {/* === MODAL THÊM KỸ NĂNG === */}
      <Modal
        show={showSkillModal}
        onHide={() => setShowSkillModal(false)}
        centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {skillToUpdateId ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Loại kỹ năng</Form.Label>
            <Form.Select
              value={newSkillData.skill_type_id}
              onChange={(e) => handleSkillTypeChange(e.target.value)}>
              <option value="">-- Chọn loại --</option>
              {skillTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tên kỹ năng</Form.Label>
            <Form.Select
              value={newSkillData.skill_id}
              disabled={skillsForType.length === 0}
              onChange={(e) => handleSkillChange(e.target.value)}>
              <option value="">-- Chọn kỹ năng --</option>
              {skillsForType.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Cấp độ</Form.Label>
            <Form.Select
              value={newSkillData.skill_level_id}
              disabled={levelsForSkill.length === 0}
              onChange={(e) =>
                setNewSkillData((prev) => ({
                  ...prev,
                  skill_level_id: e.target.value,
                }))
              }>
              <option value="">-- Chọn cấp độ --</option>
              {levelsForSkill.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSkillModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveNewSkill}>
            {skillToUpdateId ? "Cập nhật" : "Lưu"}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showResumeModal}
        onHide={() => setShowResumeModal(false)}
        centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {resumeToEdit ? "Chỉnh sửa Kinh nghiệm" : "Thêm Kinh nghiệm"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Chức danh / Công việc</Form.Label>
            <Form.Control
              type="text"
              value={resumeFormData.name}
              onChange={(e) =>
                setResumeFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Ngày bắt đầu</Form.Label>
            <Form.Control
              type="date"
              value={resumeFormData.date_start}
              onChange={(e) =>
                setResumeFormData((prev) => ({
                  ...prev,
                  date_start: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Ngày kết thúc</Form.Label>
            <Form.Control
              type="date"
              value={resumeFormData.date_end}
              onChange={(e) =>
                setResumeFormData((prev) => ({
                  ...prev,
                  date_end: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={resumeFormData.description}
              onChange={(e) =>
                setResumeFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResumeModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveResume}>
            {resumeToEdit ? "Cập nhật" : "Lưu"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProfilePage;
