import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState('300px'); // Initial height

  useEffect(() => {
    const updateHeight = () => {
      if (divRef.current) {
        setEditorHeight(`${divRef.current.clientHeight}px`);
      }
    };

    updateHeight(); // Set initial height
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div ref={divRef} style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
      <Editor
        width="100%"
        height={editorHeight}
        language={language}
        value={value}
        theme="vs-dark"
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          readOnly: false,
        }}
        onChange={(newValue) => onChange(newValue || '')}
      />
    </div>
  );
};

export default CodeEditor;
