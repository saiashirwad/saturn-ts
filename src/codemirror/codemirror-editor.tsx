import { EditorView } from "@codemirror/view"
import { langs, loadLanguage } from "@uiw/codemirror-extensions-langs"
import { githubLight, tokyoNight } from "@uiw/codemirror-themes-all"
import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror"
import { useEffect, useMemo, useRef } from "react"
import { useDarkMode } from "../utils/use-dark-mode"

loadLanguage("tsx")
langs.tsx()

const calculateEditorHeight = (content: string) => {
  const lineCount = content.split("\n").length
  const lineHeight = 18 // CodeMirror default line height
  const padding = 12 // CodeMirror default padding
  return Math.max(lineCount * lineHeight + padding, 40) // minimum height of 40px for CodeMirror
}

export function CodemirrorEditor({
  isFocused,
  ...props
}: ReactCodeMirrorProps & { isFocused?: boolean }) {
  const { theme } = useDarkMode()
  const editorRef = useRef<EditorView | null>(null)

  const editorHeight = useMemo(
    () => `${calculateEditorHeight(props.value ?? "")}px`,
    [props.value],
  )

  useEffect(() => {
    if (editorRef.current) {
      if (isFocused) {
        editorRef.current.focus()
      }
    }
  }, [isFocused])

  return (
    <div style={{ height: editorHeight }}>
      <CodeMirror
        height={editorHeight}
        basicSetup={{
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          autocompletion: false,
          indentOnInput: false,
          highlightActiveLine: true,
        }}
        theme={theme === "dark" ? tokyoNight : githubLight}
        extensions={[langs.tsx()]}
        onCreateEditor={(view) => {
          editorRef.current = view
        }}
        {...props}
      />
    </div>
  )
}
