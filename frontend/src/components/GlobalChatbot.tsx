import React from 'react';

export default function GlobalChatbot() {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      <button style={{ width: 56, height: 56, borderRadius: '50%', background: '#E60012', border: 'none', color: 'white' }}>
        💬
      </button>
    </div>
  );
}
