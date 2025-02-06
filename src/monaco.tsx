import { Editor } from "@monaco-editor/react"
import { useMemo } from "react"
import { useDarkMode } from "./utils/useDarkMode"

const calculateEditorHeight = (content: string) => {
  const lineCount = content.split("\n").length
  const lineHeight = 20 // pixels per line
  const padding = 15 // additional padding (top + bottom)
  return Math.max(lineCount * lineHeight + padding, 50) // minimum height of 50px
}

export function Monaco(props: {
  language: string
  value: string
  onChange: (value: string | undefined) => void
}) {
  const { theme } = useDarkMode()

  const editorHeight = useMemo(
    () => `${calculateEditorHeight(props.value)}px`,
    [props.value],
  )

  return (
    <Editor
      defaultValue={props.value}
      language={props.language}
      theme={theme === "dark" ? "vs-dark" : "vs-light"}
      height={editorHeight}
      value={props.value}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: "off",
        glyphMargin: false,
        folding: false,
        padding: { top: 10, bottom: 5 },
        lineDecorationsWidth: 0,
        renderLineHighlight: "none",
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        overviewRulerLanes: 0,
        scrollbar: {
          vertical: "hidden",
          horizontal: "hidden",
          alwaysConsumeMouseWheel: false,
          handleMouseWheel: false,
        },
        mouseWheelScrollSensitivity: 0,
        fixedOverflowWidgets: true,
      }}
      onChange={props.onChange}
    />
  )
}
