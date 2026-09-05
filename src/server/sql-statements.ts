/** Split migration statements without breaking quoted strings, comments, or function bodies. */
export function sqlStatements(source: string): string[] {
  const statements: string[] = []
  let start = 0, index = 0, quote = '', dollar = '', block = 0, line = false
  while (index < source.length) {
    const char = source[index], next = source[index + 1]
    if (line) { if (char === '\n') line = false; index++; continue }
    if (block) {
      if (char === '/' && next === '*') { block++; index += 2 }
      else if (char === '*' && next === '/') { block--; index += 2 }
      else index++
      continue
    }
    if (dollar) { if (source.startsWith(dollar, index)) { index += dollar.length; dollar = '' } else index++; continue }
    if (quote) {
      if (char === quote && next === quote) index += 2
      else if (char === quote) { quote = ''; index++ }
      else if (quote === "'" && char === '\\') index += 2
      else index++
      continue
    }
    if (char === '-' && next === '-') { line = true; index += 2; continue }
    if (char === '/' && next === '*') { block = 1; index += 2; continue }
    if (char === "'" || char === '"') { quote = char; index++; continue }
    if (char === '$') { const tag = source.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0]; if (tag) { dollar = tag; index += tag.length; continue } }
    if (char === ';') { const statement = source.slice(start, index).trim(); if (statement) statements.push(statement); start = index + 1 }
    index++
  }
  if (quote || dollar || block) throw new Error('Unterminated SQL string or comment in migration.')
  const tail = source.slice(start).trim()
  if (tail && !/^--[^\n]*(?:\n\s*--[^\n]*)*$/.test(tail)) statements.push(tail)
  return statements
}
