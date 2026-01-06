import { useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

type SupportedLanguage = "python" | "javascript" | "cpp" | "java";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  readOnly?: boolean;
  height?: string | number;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "100%",
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;
  };

  const getLanguageMode = (lang: SupportedLanguage | string) => {
    const languageMap: Record<string, string> = {
      python: "python",
      javascript: "javascript",
      cpp: "cpp",
      java: "java",
    };
    return languageMap[lang] ?? "plaintext";
  };

  return (
    <Editor
      height={height}
      language={getLanguageMode(language)}
      value={value}
      onChange={(val) => onChange(val ?? "")}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: "on",
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}

export default CodeEditor;


