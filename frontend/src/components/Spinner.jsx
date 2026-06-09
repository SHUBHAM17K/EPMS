import React from 'react';

const Spinner = ({ size = 'medium' }) => {
  return (
    <div className="spinner-container">
      <div className={`spinner spinner-${size}`} id="loading-spinner"></div>
    </div>
  );
};

export default Spinner;
