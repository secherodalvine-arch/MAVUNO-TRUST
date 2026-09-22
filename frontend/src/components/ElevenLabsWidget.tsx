import React, { useEffect } from 'react';

export const ElevenLabsWidget: React.FC = () => {


  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_6201m324f8y1fz8bx69fbxxr75dy';

  useEffect(() => {
    const scriptId = 'elevenlabs-convai-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.async = true;
      script.type = 'text/javascript';
      document.head.appendChild(script);
    }
  }, []);

  if (!agentId) return null;

  return <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>;
};

export default ElevenLabsWidget;
