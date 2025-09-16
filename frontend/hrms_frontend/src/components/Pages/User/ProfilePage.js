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
  Modal,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import * as odooApi from "../../../services/odooAPI";
import { FaTrash, FaPlusCircle } from "react-icons/fa";

function ProfilePage() {
  const { employeeId } = useParams();
  const {
    user,
    handleUpdateProfile,
    isUpdateLoading,
    updateSuccess,
    updateError,
  } = useAuth();

  //--- State chính ---
  const [profileData, setProfileData] = useState(null);
  // NEW: State để lưu trạng thái gốc khi bấm "Chỉnh sửa", giải quyết lỗi nút "Hủy"
  const [initialProfileData, setInitialProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [permissions, setPermissions] = useState({ can_edit: false });
  // NEW: State trigger để làm mới dữ liệu một cách chủ động và ổn định
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // --- State cho các thành phần con ---
  const [skills, setSkills] = useState({});
  const [isSkillsLoading, setIsSkillsLoading] = useState(true);
  const [resumeLines, setResumeLines] = useState([]);
  const [isResumeLoading, setIsResumeLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  // --- State cho Modals ---
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
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState(null);
  const [resumeFormData, setResumeFormData] = useState({
    name: "",
    date_start: "",
    date_end: "",
    description: "",
  });

  // --- HOOKS TẢI DỮ LIỆU CHÍNH (ĐÃ TỐI ƯU) ---

  // useEffect 1: Tải dữ liệu hồ sơ chính khi ID, user, hoặc trigger thay đổi.
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        let data, perms;
        if (employeeId) {
          // Xem hồ sơ của người khác
          const response = await odooApi.fetchEmployeeById(employeeId);
          if (response && response.profile) {
            data = response.profile;
            perms = response.permissions;
          } else {
            throw new Error("Employee not found");
          }
        } else if (user) {
          // Xem hồ sơ của chính mình
          data = user;
          perms = { can_edit: true }; // Luôn có quyền sửa của mình
        }

        if (data) {
          const formattedData = {
            ...data,
            country_id: data.country_id ? data.country_id[0] : "",
            private_state_id: data.private_state_id
              ? data.private_state_id[0]
              : "",
          };
          setProfileData(formattedData);
          setInitialProfileData(formattedData); // FIX: Lưu trạng thái ban đầu để dùng cho việc "Hủy"
          setPermissions(perms);
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        setProfileData(null); // Đảm bảo không hiển thị dữ liệu cũ nếu có lỗi
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [employeeId, user, refetchTrigger]); // Phụ thuộc vào ID, user và trigger

  // useEffect 2: Tải dữ liệu liên quan (kỹ năng, kinh nghiệm, dropdowns) MỘT LẦN sau khi có profileData.
  useEffect(() => {
    if (!profileData) return;

    const loadRelatedData = async () => {
      setIsSkillsLoading(true);
      setIsResumeLoading(true);

      // Tải đồng thời kỹ năng, kinh nghiệm và quốc gia để tăng hiệu suất
      const [skillDetails, resumeLinesData, countryList] = await Promise.all([
        profileData.employee_skill_ids?.length > 0
          ? odooApi.fetchEmployeeSkills(profileData.employee_skill_ids)
          : Promise.resolve([]),
        profileData.resume_line_ids?.length > 0
          ? odooApi.fetchEmployeeResumeLines(profileData.resume_line_ids)
          : Promise.resolve([]),
        odooApi.fetchCountries(),
      ]);

      // Xử lý Kỹ năng
      const grouped = skillDetails.reduce((acc, s) => {
        const typeName = s.skill_type_id[1];
        if (!acc[typeName]) acc[typeName] = [];
        acc[typeName].push(s);
        return acc;
      }, {});
      setSkills(grouped);
      setIsSkillsLoading(false);

      // Xử lý Kinh nghiệm
      setResumeLines(resumeLinesData);
      setIsResumeLoading(false);

      // Xử lý Dropdowns
      setCountries(countryList);
      if (profileData.country_id) {
        const stateList = await odooApi.fetchStatesByCountry(
          profileData.country_id
        );
        setStates(stateList);
      } else {
        setStates([]);
      }
    };

    loadRelatedData();
  }, [profileData]); // Chỉ phụ thuộc vào profileData

  // --- CÁC HÀM XỬ LÝ (HANDLERS) ---

  // FIX: Cơ chế làm mới dữ liệu ổn định
  const forceRefetch = () => {
    setRefetchTrigger((c) => c + 1);
  };

  const handleCountryChange = async (e) => {
    const countryId = parseInt(e.target.value) || null;
    setProfileData((prev) => ({
      ...prev,
      country_id: countryId,
      private_state_id: "",
    }));
    if (countryId) {
      const stateList = await odooApi.fetchStatesByCountry(countryId);
      setStates(stateList);
    } else {
      setStates([]);
    }
  };

  const handleStateChange = (e) => {
    const stateId = parseInt(e.target.value) || null;
    setProfileData((prev) => ({ ...prev, private_state_id: stateId }));
  };

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

  const handleSaveResume = async () => {
    try {
      if (resumeToEdit) {
        await odooApi.updateResumeLine(resumeToEdit, resumeFormData);
      } else {
        await odooApi.addResumeLine({
          employee_id: profileData.id, // Dùng ID từ profileData
          ...resumeFormData,
        });
      }
      setShowResumeModal(false);
      setResumeToEdit(null);
      forceRefetch();
    } catch (error) {
      console.error("Lỗi khi lưu resume:", error);
      alert("Lưu kinh nghiệm thất bại. Vui lòng thử lại.");
    }
  };

  const handleShowSkillModal = async () => {
    const types = await odooApi.fetchSkillTypes();
    setSkillTypes(types);
    setShowSkillModal(true);
  };

  const handleSkillTypeChange = async (typeId) => {
    setNewSkillData({
      skill_type_id: typeId,
      skill_id: "",
      skill_level_id: "",
    });
    setSkillsForType([]);
    setLevelsForSkill([]);
    if (typeId) {
      const id = parseInt(typeId);
      const [skills, levels] = await Promise.all([
        odooApi.fetchSkillsByType(id),
        odooApi.fetchSkillLevelsByType(id),
      ]);
      setSkillsForType(skills);
      setLevelsForSkill(levels);
    }
  };

  const handleSkillChange = async (skillId) => {
    setNewSkillData((prev) => ({
      ...prev,
      skill_id: skillId,
      skill_level_id: "",
    }));
    setSkillToUpdateId(null);
    if (skillId) {
      const parsedSkillId = parseInt(skillId);
      const allSkills = Object.values(skills).flat();
      const existingSkill = allSkills.find(
        (s) => s.skill_id[0] === parsedSkillId
      );
      if (existingSkill) {
        setSkillToUpdateId(existingSkill.id);
        setNewSkillData((prev) => ({
          ...prev,
          skill_level_id: existingSkill.skill_level_id[0],
        }));
      }
    }
  };

  const handleEditSkill = async (skill) => {
    const types = await odooApi.fetchSkillTypes();
    setSkillTypes(types);
    const [skillsList, levelsList] = await Promise.all([
      odooApi.fetchSkillsByType(skill.skill_type_id[0]),
      odooApi.fetchSkillLevelsByType(skill.skill_type_id[0]),
    ]);
    setSkillsForType(skillsList);
    setLevelsForSkill(levelsList);
    setNewSkillData({
      skill_type_id: skill.skill_type_id[0],
      skill_id: skill.skill_id[0],
      skill_level_id: skill.skill_level_id[0],
    });
    setSkillToUpdateId(skill.id);
    setShowSkillModal(true);
  };

  const handleSaveNewSkill = async () => {
    if (!newSkillData.skill_id || !newSkillData.skill_level_id) {
      alert("Vui lòng chọn đầy đủ kỹ năng và cấp độ.");
      return;
    }
    try {
      if (skillToUpdateId) {
        await odooApi.updateEmployeeSkill(skillToUpdateId, {
          skill_level_id: parseInt(newSkillData.skill_level_id),
        });
      } else {
        await odooApi.addEmployeeSkill({
          employee_id: profileData.id,
          skill_id: parseInt(newSkillData.skill_id),
          skill_level_id: parseInt(newSkillData.skill_level_id),
          skill_type_id: parseInt(newSkillData.skill_type_id),
        });
      }
      setShowSkillModal(false);
      forceRefetch();
    } catch (error) {
      console.error("Lỗi khi lưu kỹ năng:", error);
      alert("Lưu kỹ năng thất bại. Vui lòng thử lại.");
    }
  };

  const handleDeleteSkill = async (skillLineId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) {
      await odooApi.deleteEmployeeSkill(skillLineId);
      forceRefetch();
    }
  };

  const handleDeleteResume = async (resumeLineId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kinh nghiệm này?")) {
      await odooApi.deleteResumeLine(resumeLineId);
      forceRefetch();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const targetId = profileData.id;
    const changedData = {};

    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== initialProfileData[key]) {
        changedData[key] = profileData[key];
      }
    });

    if (Object.keys(changedData).length > 0) {
      await handleUpdateProfile(targetId, changedData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData(initialProfileData);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setInitialProfileData(profileData);
    setIsEditing(true);
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          Không thể tải thông tin hồ sơ. Vui lòng thử lại.
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="my-4">
        <Card>
          <Card.Body>
            {updateSuccess && (
              <Alert variant="success">Cập nhật thông tin thành công!</Alert>
            )}
            {updateError && <Alert variant="danger">{updateError}</Alert>}

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
                    readOnly={!isEditing || !permissions.can_edit}
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
                    readOnly={!isEditing || !permissions.can_edit}
                    className="bg-transparent border-0 ps-0 text-muted fs-4"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="work_info"
              id="profile-tabs"
              className="mb-3">
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Số di động công việc</Form.Label>
                        <Form.Control
                          type="text"
                          name="mobile_phone"
                          value={profileData.mobile_phone || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !permissions.can_edit}
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Xã/ Phường</Form.Label>
                        <Form.Control
                          type="text"
                          name="private_street2"
                          value={profileData.private_street2 || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Tỉnh / Thành phố</Form.Label>
                        <Form.Select
                          name="private_state_id"
                          value={profileData.private_state_id || ""}
                          onChange={handleStateChange}
                          disabled={
                            !isEditing ||
                            !permissions.can_edit ||
                            states.length === 0
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Điện Thoại Cá Nhân</Form.Label>
                        <Form.Control
                          type="text"
                          name="private_phone"
                          value={profileData.private_phone || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !permissions.can_edit}
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Số Điện Thoại Khẩn Cấp</Form.Label>
                        <Form.Control
                          type="text"
                          name="emergency_phone"
                          value={profileData.emergency_phone || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !permissions.can_edit}
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
                          disabled={!isEditing || !permissions.can_edit}>
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Số Hộ chiếu</Form.Label>
                        <Form.Control
                          type="text"
                          name="passport_id"
                          value={profileData.passport_id || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Giới Tính</Form.Label>
                        <Form.Select
                          name="gender"
                          value={profileData.gender || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing || !permissions.can_edit}>
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Tình Trạng Hôn Nhân</Form.Label>
                        <Form.Select
                          name="marital"
                          value={profileData.marital || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing || !permissions.can_edit}>
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
                            readOnly={!isEditing || !permissions.can_edit}
                          />
                        </Form.Group>
                      )}
                      <Form.Group className="mb-3">
                        <Form.Label>Bằng Cấp</Form.Label>
                        <Form.Select
                          name="certificate"
                          value={profileData.certificate || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing || !permissions.can_edit}>
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Trường Học</Form.Label>
                        <Form.Control
                          type="text"
                          name="study_school"
                          value={profileData.study_school || ""}
                          onChange={handleInputChange}
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Tab>

              <Tab eventKey="skills_resume" title="Kỹ năng & Kinh nghiệm">
                <Row className="p-3">
                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>Kỹ năng</h4>
                      {permissions.can_edit && (
                        <Button variant="link" onClick={handleShowSkillModal}>
                          <FaPlusCircle /> Thêm
                        </Button>
                      )}
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
                                  className={
                                    permissions.can_edit
                                      ? "cursor-pointer text-primary"
                                      : ""
                                  }
                                  onClick={() =>
                                    permissions.can_edit &&
                                    handleEditSkill(skill)
                                  }>
                                  {skill.skill_id[1]}
                                </span>
                                <small className="d-flex align-items-center">
                                  {skill.skill_level_id[1]}
                                  {permissions.can_edit && (
                                    <FaTrash
                                      className="ms-2 text-danger cursor-pointer"
                                      onClick={() =>
                                        handleDeleteSkill(skill.id)
                                      }
                                    />
                                  )}
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

                  <Col md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4>Kinh nghiệm</h4>
                      {permissions.can_edit && (
                        <Button
                          variant="link"
                          onClick={() => setShowResumeModal(true)}>
                          <FaPlusCircle /> Thêm
                        </Button>
                      )}
                    </div>
                    {isResumeLoading ? (
                      <Spinner size="sm" />
                    ) : resumeLines.length > 0 ? (
                      resumeLines.map((line) => (
                        <div
                          key={line.id}
                          className={`mb-3 border-bottom pb-2 ${
                            permissions.can_edit ? "cursor-pointer" : ""
                          }`}
                          onClick={() =>
                            permissions.can_edit && handleEditResume(line)
                          }>
                          <div className="d-flex justify-content-between">
                            <h6 className="fw-bold">{line.name}</h6>
                            {permissions.can_edit && (
                              <FaTrash
                                className="text-danger cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteResume(line.id);
                                }}
                              />
                            )}
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
                          disabled={!isEditing || !permissions.can_edit}>
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
                          readOnly={!isEditing || !permissions.can_edit}
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
                          readOnly={!isEditing || !permissions.can_edit}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Tab>
            </Tabs>

            <div className="text-end mt-4">
              {permissions.can_edit && !isEditing && (
                <Button variant="primary" onClick={handleEditClick}>
                  Chỉnh Sửa
                </Button>
              )}
              {permissions.can_edit && isEditing && (
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
