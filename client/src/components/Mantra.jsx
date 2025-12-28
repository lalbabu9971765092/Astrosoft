// client/src/components/Mantra.jsx
import React from 'react';

const Mantra = ({ textHi, textEn, title }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>{title}</h2>
      <p style={{ fontSize: '20px' }}>{textHi}</p>
      <p style={{ fontSize: '18px', fontStyle: 'italic' }}>{textEn}</p>
    </div>
  );
};

export default Mantra;
