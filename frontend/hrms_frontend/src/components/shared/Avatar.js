// src/components/shared/Avatar.js
import React from "react";
import defaultAvatar from "../../assets/images/default-avatar.png";

const Avatar = ({
  src,
  altText = "Avatar",
  size = 40,
  style = {},
  ...props
}) => {
  const handleError = (e) => {
    if (e.target.src !== defaultAvatar) {
      e.target.onerror = null;
      e.target.src = defaultAvatar;
    }
  };

  const mergedStyle = {
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "50%",
    display: "inline-block",
    ...style, // merge style từ props, cho phép border, margin, ...
  };

  return (
    <img
      src={src || defaultAvatar}
      alt={altText}
      style={mergedStyle}
      onError={handleError}
      {...props}
    />
  );
};

export default React.memo(Avatar);
