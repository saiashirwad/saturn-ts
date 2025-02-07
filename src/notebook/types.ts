export type CodeCell = {
  id: string
  type: "code"
  code: string
  output: any
  executionCount: number | null
  error: string | null
  references: string[]
}

export type MarkdownCell = {
  id: string
  type: "markdown"
  content: string
  references: string[]
}

export type Cell = CodeCell | MarkdownCell
