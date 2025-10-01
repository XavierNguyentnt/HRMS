import React, { useState, useEffect } from "react";
import { fetchBase64Image, fetchUserByPartnerId } from "../../services/api";
import defaultAvatar from "../../assets/images/default-avatar.png";

/**
 * Component Avatar linh hoạt...
 * @param {object} props
 * @param {string} [props.src] - Nguồn ảnh trực tiếp (ưu tiên cao nhất). Có thể là base64 string.
 * @param {number} props.partnerId - ID của res.partner để tìm avatar (nếu không có src).
 * @param {string} [props.altText='Avatar'] - Văn bản thay thế cho ảnh.
 * @param {string} [props.className=''] - Class CSS tùy chỉnh.
 * @param {number} [props.size=40] - Kích thước avatar.
 */
const Avatar = ({
  src, // <-- PROPS MỚI
  partnerId,
  altText = "Avatar",
  className = "",
  size = 40,
}) => {
  // Ưu tiên src, nếu không có thì dùng ảnh mặc định
  const [avatarSrc, setAvatarSrc] = useState(src || defaultAvatar);

  useEffect(() => {
    // NẾU CÓ `src` ĐƯỢC TRUYỀN VÀO, SỬ DỤNG NÓ VÀ BỎ QUA LOGIC FETCH
    if (src) {
      setAvatarSrc(src);
      return;
    }

    // NẾU KHÔNG CÓ `src` VÀ KHÔNG CÓ `partnerId`, DÙNG ẢNH MẶC ĐỊNH
    if (!partnerId) {
      setAvatarSrc(defaultAvatar);
      return;
    }

    // LOGIC FETCH CŨ, CHỈ CHẠY KHI KHÔNG CÓ `src` VÀ CÓ `partnerId`
    const loadAvatar = async () => {
      setAvatarSrc(defaultAvatar); // Reset trước khi fetch
      const partnerImageUrl = `/image/res.partner/${partnerId}/avatar_128`;
      let imageData = await fetchBase64Image(partnerImageUrl);

      if (!imageData) {
        const user = await fetchUserByPartnerId(partnerId);
        if (user && user.image_128) {
          imageData = `data:image/png;base64,${user.image_128}`;
        }
      }

      if (imageData) {
        setAvatarSrc(imageData);
      }
    };

    loadAvatar();
  }, [src, partnerId]); // Chạy lại khi src hoặc partnerId thay đổi

  return (
    <img
      src={avatarSrc}
      alt={altText}
      className={`avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "cover",
        borderRadius: "50%",
      }}
      onError={() => setAvatarSrc(defaultAvatar)}
    />
  );
};

export default React.memo(Avatar);
