import { EditorView } from "@codemirror/view";
import { langs, loadLanguage } from "@uiw/codemirror-extensions-langs";
import { githubDark, githubLight } from "@uiw/codemirror-themes-all";
import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef } from "react";
import { useDarkMode } from "../utils/use-dark-mode";

loadLanguage("tsx");
langs.tsx();

const calculateEditorHeight = (content: string) => {
  const lineCount = content.split("\n").length;
  const lineHeight = 18; // CodeMirror default line height
  const padding = 12; // CodeMirror default padding
  return Math.max(lineCount * lineHeight + padding, 40); // minimum height of 40px for CodeMirror
};

const basicSetupConfig = {
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  autocompletion: false,
  indentOnInput: false,
  highlightActiveLine: true,
} as const;

export function CodemirrorEditor({
  isFocused,
  ...props
}: ReactCodeMirrorProps & { isFocused?: boolean }) {
  const { theme } = useDarkMode();
  const editorRef = useRef<EditorView | null>(null);
  const editorHeight = useMemo(
    () => `${calculateEditorHeight(props.value ?? "")}px`,
    [props.value],
  );

  const extensions = useMemo(() => [langs.tsx()], []);

  useEffect(() => {
    if (editorRef.current) {
      if (isFocused) {
        editorRef.current.focus();
      }
    }
  }, [isFocused]);

  return (
    <div style={{ height: editorHeight }}>
      <CodeMirror
        height={editorHeight}
        basicSetup={basicSetupConfig}
        theme={theme === "dark" ? githubDark : githubLight}
        extensions={extensions}
        onCreateEditor={(view) => {
          editorRef.current = view;
        }}
        {...props}
      />
    </div>
  );
}
