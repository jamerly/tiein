import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange }) => {
  return (
    <Editor
      width="100%"
      height="300"
      language={language}
      value={value}
      options={{
        selectOnLineNumbers: true,
        minimap: { enabled: false },
        readOnly: false,
      }}
      onChange={(newValue) => onChange(newValue || '')}
    />
  );
};

export default CodeEditor;
