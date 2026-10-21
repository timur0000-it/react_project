import React from 'react';
import { Loader2 } from 'lucide-react';

// сгенерируй мне лоадер в виде реакт компонента, простой но красивый с lucide react

export function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}