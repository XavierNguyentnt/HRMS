import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Image,
  Spinner,
  Alert,
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
  const {
    user,
    handleUpdateProfile,
    isUpdateLoading,
    updateError,
    updateSuccess,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [profileImageFile, setProfileImageFile] = useState(null); // Lưu File object
  const [previewImage, setPreviewImage] = useState("/default-avatar.png"); // URL để hiển thị

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
      });
      // Odoo trả về ảnh dưới dạng base64 trong trường image_1920 (hoặc image_128, etc.)
      if (user.image_1920) {
        setPreviewImage(`data:image/jpeg;base64,${user.image_1920}`);
      } else {
        setPreviewImage("/default-avatar.png");
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file); // Lưu file object để chuyển đổi sau
      setPreviewImage(URL.createObjectURL(file)); // Tạo URL tạm thời để xem trước
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Tạo một object JSON để gửi đi, không dùng FormData nữa
    const updatePayload = {
      name: formData.name,
    };

    // Nếu người dùng có chọn ảnh mới, chuyển nó sang base64
    if (profileImageFile) {
      try {
        const base64Image = await fileToBase64(profileImageFile);
        // Tên trường ảnh trong Odoo thường là image_1920, image_1024, etc.
        updatePayload.image_1920 = base64Image;
      } catch (error) {
        console.error("Lỗi chuyển đổi file sang base64:", error);
        // Bạn có thể hiển thị lỗi này cho người dùng nếu cần
        return;
      }
    }

    // Gọi hàm từ context với userId và payload JSON
    const success = await handleUpdateProfile(user.uid, updatePayload);
    if (success) {
      setIsEditing(false); // Tắt chế độ chỉnh sửa nếu thành công
      setProfileImageFile(null); // Reset file đã chọn
    }
  };

  if (!user) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8} xl={7}>
          <Card className="shadow-sm">
            <Card.Header as="h4">Thông tin cá nhân</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="align-items-center">
                  <Col md={4} className="text-center mb-4 mb-md-0">
                    <Image
                      src={previewImage}
                      roundedCircle
                      fluid
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        border: "3px solid #dee2e6",
                      }}
                    />
                    {isEditing && (
                      <Form.Group controlId="formFile" className="mt-3">
                        <Form.Control
                          type="file"
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                      </Form.Group>
                    )}
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3" controlId="profileName">
                      <Form.Label>Họ và Tên</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        size="lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="profileEmail">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={user.email || user.login || ""}
                        disabled // Email thường không cho phép thay đổi
                        size="lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr />

                {/* Hiển thị thông báo thành công hoặc lỗi */}
                {updateSuccess && (
                  <Alert
                    variant="success"
                    onClose={() => {
                      /* logic to hide alert */
                    }}
                    dismissible>
                    Cập nhật thông tin thành công!
                  </Alert>
                )}
                {updateError && (
                  <Alert
                    variant="danger"
                    onClose={() => {
                      /* logic to hide alert */
                    }}
                    dismissible>
                    {updateError}
                  </Alert>
                )}

                <div className="text-end">
                  {isEditing ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditing(false)}
                        className="me-2">
                        Hủy
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isUpdateLoading}>
                        {isUpdateLoading ? (
                          <Spinner
                            as="span"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                        ) : (
                          "Lưu thay đổi"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline-primary"
                      onClick={() => setIsEditing(true)}>
                      Chỉnh sửa thông tin
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
