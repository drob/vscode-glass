import * as vscode from 'vscode'

export class CustomFoldingRangeProvider {
  provideFoldingRanges(document, _context, _token) {
    const ranges = []
    const startPattern = /^-- .+$/
    const endPattern = /^--$/
    let startLine = null

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i)
      if (startPattern.test(line.text)) {
        if (startLine) {
          ranges.push(
            new vscode.FoldingRange(startLine.lineNumber, line.lineNumber - 1)
          )
        }
        startLine = line
      } else if (endPattern.test(line.text)) {
        if (startLine) {
          ranges.push(
            new vscode.FoldingRange(startLine.lineNumber, line.lineNumber)
          )
          startLine = null
        }
      }
    }

    return ranges
  }
}
