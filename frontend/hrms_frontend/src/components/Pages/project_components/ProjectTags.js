import React from "react";

const ProjectTags = ({ tags }) => {
  return (
    <div className="d-inline-flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`badge rounded-pill text-bg-custom o_tag_color_${
            tag.color ?? 0
          }`}>
          {tag.name}
        </span>
      ))}
    </div>
  );
};

export default ProjectTags;
