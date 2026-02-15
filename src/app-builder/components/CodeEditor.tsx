import React, { useMemo, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Extension } from '@codemirror/state';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  collabExtension?: Extension[];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, readOnly, collabExtension }) => {
  const extensions = useMemo(() => {
    const exts: Extension[] = [javascript({ jsx: true, typescript: true })];
    if (collabExtension && collabExtension.length > 0) {
      exts.push(...collabExtension);
    }
    return exts;
  }, [collabExtension]);

  const handleChange = useCallback(
    (val: string) => onChange(val),
    [onChange],
  );

  return (
    <CodeMirror
      value={collabExtension && collabExtension.length > 0 ? undefined : value}
      onChange={handleChange}
      extensions={extensions}
      theme="dark"
      readOnly={readOnly}
      className="h-full overflow-hidden [&_.cm-editor]:!h-full [&_.cm-scroller]:!font-mono [&_.cm-scroller]:!text-[13px] [&_.cm-editor]:!bg-[#0a0a0a] [&_.cm-gutters]:!bg-[#111] [&_.cm-gutters]:!border-r-[#1a1a1a] [&_.cm-activeLineGutter]:!bg-[#1a1a1a] [&_.cm-activeLine]:!bg-[#ffffff06]
      [&_.cm-ySelectionInfo]:!text-[10px] [&_.cm-ySelectionInfo]:!font-bold [&_.cm-ySelectionInfo]:!px-1.5 [&_.cm-ySelectionInfo]:!py-0.5 [&_.cm-ySelectionInfo]:!rounded-md [&_.cm-ySelectionInfo]:!opacity-90"
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
