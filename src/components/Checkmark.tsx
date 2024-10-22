// src/components/Checkmark.tsx
import React from 'react';
import './Checkmark.css';

const Checkmark: React.FC = () => {
  return (
    <svg className="checkmark" viewBox="0 0 52 52">
      <circle
        className="checkmark-circle"
        cx="26"
        cy="26"
        r="25"
        fill="none"
      />
      <path
        className="checkmark-check"
        fill="none"
        d="M14 27l7 7 16-16"
      />
    </svg>
  );
};

export default Checkmark;