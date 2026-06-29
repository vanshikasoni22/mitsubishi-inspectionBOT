import React from 'react';

export interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  return (
    <div style={{ padding: 24, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 12 }}>
      <h3>Camera Feed Loading...</h3>
      <button onClick={onClose}>Close Camera</button>
    </div>
  );
}
