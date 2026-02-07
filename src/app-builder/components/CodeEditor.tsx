import React, { useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, readOnly }) => {
  const extensions = useMemo(
    () => [javascript({ jsx: true, typescript: true })],
    [],
  );

  const handleChange = useCallback(
    (val: string) => onChange(val),
    [onChange],
  );

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme="dark"
      readOnly={readOnly}
      className="h-full overflow-hidden [&_.cm-editor]:!h-full [&_.cm-scroller]:!font-mono [&_.cm-scroller]:!text-[13px] [&_.cm-editor]:!bg-[#0a0a0a] [&_.cm-gutters]:!bg-[#111] [&_.cm-gutters]:!border-r-[#1a1a1a] [&_.cm-activeLineGutter]:!bg-[#1a1a1a] [&_.cm-activeLine]:!bg-[#ffffff06]"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        autocompletion: false,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
        searchKeymap: true,
      }}
    />
  );
};
