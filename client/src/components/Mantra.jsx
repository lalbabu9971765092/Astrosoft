// client/src/components/Mantra.jsx
import React from 'react';

const Mantra = ({ text, title }) => {
  return (
    <div style={{ padding: '20px', 'textAlign': 'center' }}>
      <h2>{title}</h2>
      <p style={{ fontSize: '20px' }}>{text}</p>
    </div>
  );
};

export default Mantra;
