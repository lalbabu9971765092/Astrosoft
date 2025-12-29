// client/src/components/FullStutiPdfContent.jsx
import React from 'react';

const FullStutiPdfContent = ({ textHi, textEn, title }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>{title}</h2>
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <h3>Hindi (Devanagari):</h3>
        {textHi.split('\n').map((paragraph, index) => (
          <p key={`hi-${index}`} style={{ fontSize: '12px', lineHeight: '1.5' }}>{paragraph}</p>
        ))}
      </div>
      <div style={{ textAlign: 'left' }}>
        <h3>English Transliteration:</h3>
        {textEn.split('\n').map((paragraph, index) => (
          <p key={`en-${index}`} style={{ fontSize: '12px', lineHeight: '1.5', fontStyle: 'italic' }}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default FullStutiPdfContent;
