import { EditorView } from "@codemirror/view"
import { langs, loadLanguage } from "@uiw/codemirror-extensions-langs"
import { githubLight, tokyoNight } from "@uiw/codemirror-themes-all"
import CodeMirror from "@uiw/react-codemirror"
import { useEffect, useMemo, useRef } from "react"
import { setFocusedCell } from "../notebook/notebook-store"
import { useDarkMode } from "../utils/use-dark-mode"

loadLanguage("tsx")
langs.tsx()

const calculateEditorHeight = (content: string) => {
  const lineCount = content.split("\n").length
  const lineHeight = 18 // CodeMirror default line height
  const padding = 12 // CodeMirror default padding
  return Math.max(lineCount * lineHeight + padding, 40) // minimum height of 40px for CodeMirror
}

export function CodemirrorEditor(props: {
  id: string
  language: string
  value: string
  onChange: (value: string | undefined) => void
  isFocused?: boolean
}) {
  const { theme } = useDarkMode()
  const editorRef = useRef<EditorView | null>(null)

  const editorHeight = useMemo(
    () => `${calculateEditorHeight(props.value)}px`,
    [props.value],
  )

  useEffect(() => {
    if (editorRef.current) {
      if (props.isFocused) {
        editorRef.current.focus()
      }
    }
  }, [props.isFocused])

  return (
    <div style={{ height: editorHeight }}>
      <CodeMirror
        value={props.value}
        height={editorHeight}
        onChange={props.onChange}
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
        onFocus={() => {
          setFocusedCell(props.id)
        }}
        onBlur={() => {
          // TODO: execute code if it's a reactive cell
          // TODO: if it's a function cell, update globals with information about the function
        }}
      />
    </div>
  )
}
