import React, { useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (newValue: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange, readOnly = false }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    // Optional: Configure Monaco Editor here if needed
  };

  const handleChange = (newValue: string, event: any) => {
    onChange(newValue);
  };

  return (
    <MonacoEditor
      width="100%"
      height="600px"
      language={language}
      theme="vs-dark" // Or 'light'
      value={value}
      options={{
        readOnly: readOnly,
        minimap: { enabled: false },
        // Add other options as needed
      }}
      onChange={handleChange}
      editorDidMount={handleEditorDidMount}
    />
  );
};

export default CodeEditor;
