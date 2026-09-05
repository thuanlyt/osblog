export interface Selection {
  value: string
  start: number
  end: number
}

function linesRange(value: string, start: number, end: number): { lineStart: number; lineEnd: number } {
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const lookup = value.indexOf('\n', end)
  const lineEnd = lookup === -1 ? value.length : lookup
  return { lineStart, lineEnd }
}

function wrapSelection(selection: Selection, before: string, after: string, placeholder: string): Selection {
  const { value, start, end } = selection
  const selected = value.slice(start, end) || placeholder
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  return { value: next, start: start + before.length, end: start + before.length + selected.length }
}

function prefixLines(selection: Selection, prefix: string): Selection {
  const { value, start, end } = selection
  const { lineStart, lineEnd } = linesRange(value, start, end)
  const block = value.slice(lineStart, lineEnd)
  const updated = block
    .split('\n')
    .map((line) => (line.startsWith(prefix) ? line : prefix + line))
    .join('\n')
  const next = value.slice(0, lineStart) + updated + value.slice(lineEnd)
  return { value: next, start: start + prefix.length, end: end + prefix.length * updated.split('\n').length }
}

export type ToolbarAction = 'heading' | 'bold' | 'italic' | 'link' | 'image' | 'list' | 'quote' | 'code'

export function applyToolbarAction(action: ToolbarAction, selection: Selection): Selection {
  switch (action) {
    case 'heading':
      return prefixLines(selection, '## ')
    case 'bold':
      return wrapSelection(selection, '**', '**', 'bold text')
    case 'italic':
      return wrapSelection(selection, '*', '*', 'italic text')
    case 'quote':
      return prefixLines(selection, '> ')
    case 'list':
      return prefixLines(selection, '- ')
    case 'link': {
      const { value, start, end } = selection
      const label = value.slice(start, end) || 'link text'
      const snippet = `[${label}](https://)`
      const next = value.slice(0, start) + snippet + value.slice(end)
      const urlStart = start + label.length + 3
      return { value: next, start: urlStart, end: urlStart + 8 }
    }
    case 'image': {
      const { value, start, end } = selection
      const label = value.slice(start, end) || 'alt text'
      const snippet = `![${label}](https://)`
      const next = value.slice(0, start) + snippet + value.slice(end)
      const urlStart = start + label.length + 4
      return { value: next, start: urlStart, end: urlStart + 8 }
    }
    case 'code': {
      const { value, start, end } = selection
      const selected = value.slice(start, end)
      if (selected.includes('\n') || selected === '') {
        const placeholder = selected || 'code'
        const snippet = `\n\`\`\`\n${placeholder}\n\`\`\`\n`
        const next = value.slice(0, start) + snippet + value.slice(end)
        return { value: next, start: start + 5, end: start + 5 + placeholder.length }
      }
      return wrapSelection(selection, '`', '`', 'code')
    }
    default:
      return selection
  }
}
