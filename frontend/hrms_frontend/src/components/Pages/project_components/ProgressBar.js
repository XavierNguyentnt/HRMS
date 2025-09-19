// src/components/Pages/project_components/ProgressBar.js
import React from "react";

const ProgressBar = ({ value }) => {
  const progress = Math.min(value || 0, 100);
  return (
    <div className="o_progressbar w-100 d-flex align-items-center">
      <div className="progress custom-progress w-100">
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"></div>
      </div>
      <span className="ms-2">{progress}%</span>
    </div>
  );
};

export default ProgressBar;
