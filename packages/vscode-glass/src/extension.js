// @ts-nocheck
/**
 * @typedef {import('vscode').ExtensionContext} ExtensionContext
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import * as vscode from 'vscode'
import {commands, workspace} from 'vscode'
import {LanguageClient} from 'vscode-languageclient/node.js'
import {CustomFoldingRangeProvider} from './folding-range-provider.js'

/**
 * @type {LanguageClient}
 */
let client

/**
 * Activate the extension.
 *
 * @param {ExtensionContext} context
 *   The extension context as given by VSCode.
 */
export async function activate(context) {
  client = new LanguageClient(
    'Glass',
    {module: context.asAbsolutePath('out/language-server.js')},
    {
      documentSelector: [
        {scheme: 'file', language: 'glass'},
        {scheme: 'file', language: 'typescript'},
        {scheme: 'file', language: 'typescriptreact'},
        {scheme: 'file', language: 'javascript'},
        {scheme: 'file', language: 'javascriptreact'}
      ]
    }
  )

  const extension = 'glass' // Replace with your desired extension

  const foldingRangeProvider = new CustomFoldingRangeProvider()
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
      {language: 'glass'},
      foldingRangeProvider
    )
  )

  let activeEditor = vscode.window.activeTextEditor
  let timeout = null

  if (activeEditor) {
    triggerUpdateDecorations()
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor
      if (editor) {
        triggerUpdateDecorations()
      }
    },
    null,
    context.subscriptions
  )

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations()
      }
    },
    null,
    context.subscriptions
  )

  const systemDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(249,38,114,.05)', // Set the desired background color
    isWholeLine: true
  })

  const userDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(45,249,38,0.05)', // Set the desired background color
    isWholeLine: true
  })

  const assistantDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(143,38,249,0.05)', // Set the desired background color
    isWholeLine: true
  })

  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(updateDecorations, 500)
  }

  function updateDecorations() {
    if (!activeEditor) {
      return
    }

    function addSystem() {
      const regEx = /^--\s*system\s*$(.*?)^--$/gms
      const regEx2 = /^--\s*\[[^\n]+\]\.system\s*$(.*?)^--$/gms
      const text = activeEditor.document.getText()
      const highlights = []

      let match = null
      while ((match = regEx.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index)
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        )
        const range = new vscode.Range(startPos, endPos)
        const decoration = {range}
        highlights.push(decoration)
      }
      while ((match = regEx2.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index)
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        )
        const range = new vscode.Range(startPos, endPos)
        const decoration = {range}
        highlights.push(decoration)
      }

      activeEditor.setDecorations(systemDecoration, highlights)
    }

    function addUser() {
      const regEx = /^--\s*user\s*$(.*?)^--$/gms
      const regEx2 = /^--\s*\[[^\n]+\]\.user\s*$(.*?)^--$/gms
      const text = activeEditor.document.getText()
      const highlights = []

      let match = null
      while ((match = regEx.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index)
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        )
        const range = new vscode.Range(startPos, endPos)
        const decoration = {range}
        highlights.push(decoration)
      }
      while ((match = regEx2.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index)
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        )
        const range = new vscode.Range(startPos, endPos)
        const decoration = {range}
        highlights.push(decoration)
      }

      activeEditor.setDecorations(userDecoration, highlights)
    }

    function addAssistant() {
      const regEx = /^--\s*assistant\s*$(.*?)^--$/gms
      const regEx2 = /^--\s*\[[^\n]+\]\.assistant\s*$(.*?)^--$/gms
      const text = activeEditor.document.getText()
      const highlights = []

      let match = null
      while ((match = regEx.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index)
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        )
        const range = new vscode.Range(startPos, endPos)
        const decoration = {range}
        highlights.push(decoration)
      }
      while ((match = regEx2.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index)
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        )
        const range = new vscode.Range(startPos, endPos)
        const decoration = {range}
        highlights.push(decoration)
      }

      activeEditor.setDecorations(assistantDecoration, highlights)
    }

    addSystem()
    addUser()
    addAssistant()
  }

  function processFile(filePath) {
    const file = filePath.split('/').slice(-1)[0]
    // const folderPath = filePath.split('/').slice(0, -1).join('/')
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively process files in subdirectory
      processFilesInFolder(filePath)
    } else if (path.extname(file) === `.${extension}`) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const fileBase = path.basename(file, `.${extension}`)

      // const functionName = camelCase(
      //   'get' + fileBase[0].toUpperCase() + fileBase.slice(1)
      // )

      // const newFileName = `${fileBase}.ts` // TODO: allow other languages
      // const newFilePath = path.join(folderPath, newFileName)

      // Transpile the glass file to the target language.
      const {code} = compile(fileContent, fileBase)
      // fs.writeFileSync(newFilePath, code)
      return code
    }
  }

  function processFilesInFolder(folderPath) {
    const files = fs.readdirSync(folderPath)
    const codeBlocks = []
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      codeBlocks.push(processFile(filePath))
    }
    return codeBlocks.join('\n\n')
  }

  context.subscriptions.push(
    commands.registerCommand('glass.transpileAll', () => {
      const workspaceFolders = workspace.workspaceFolders
      if (workspaceFolders) {
        for (const workspaceFolder of workspaceFolders) {
          const folderPath = workspaceFolder.uri.fsPath
          const code = processFilesInFolder(folderPath)
          vscode.env.clipboard.writeText(code)
        }
      }
    }),
    commands.registerCommand('glass.transpileCurrentFile', () => {
      let editor = vscode.window.activeTextEditor
      if (editor) {
        let document = editor.document
        let filePath = document.uri.fsPath
        try {
          const code = processFile(filePath)
          vscode.env.clipboard.writeText(code)
        } catch (e) {
          console.error(e)
          throw e
        }
      }
    })
  )

  await client.start()
}

/**
 * Deactivate the extension.
 */
export async function deactivate() {
  if (client) {
    await client.stop()
  }
}

function compile(doc, functionName) {
  // const tree = fromMarkdown(doc, {
  //   extensions: [mdxjs(), frontmatter(['yaml', 'toml'])],
  //   mdastExtensions: [
  //     mdxFromMarkdown(),
  //     frontmatterFromMarkdown(['yaml', 'toml'])
  //   ]
  // })

  // const parts = []
  // const imports = []
  // const args = []
  // const params = {}
  // let isAsync = false
  // for (const node of tree.children) {
  //   const async = getParts(node, parts, imports, args, params)
  //   if (async) {
  //     isAsync = true
  //   }
  // }

  // const i = imports.join('\n')

  // console.log('all imports', allImports)

  // Const importLines = i.trim().split('\n')
  // const remainingImports = []

  // const modelFunctions = []

  // for (const importLine of importLines) {
  //   const line = importLine.trim()
  //   if (line.includes('https://')) {
  //     // line looks like "import model from './foo/bar/foo.glass"
  //     // extract the org, model name, and version
  //     if (line.includes('@')) {
  //       const [importName, org, model, version] = line.match(
  //         /import (\w+) from https:\/\/foundation-ui.com\/(\w+)\/(\w+)@(\d+\.\d+\.\d+)/
  //       )
  //       modelFunctions.push({importName, org, model, version})
  //     } else {
  //       const [importName, org, model] = line.match(
  //         /import (\w+) from https:\/\/foundation-ui.com\/(\w+)\/(\w+)/
  //       )
  //     }

  //   } else {
  //     remainingImports.push(importLine)
  //   }
  // }

  const language = workspace.getConfiguration('glass').get('language')
  if (language === 'python') {
    throw new Error('python not supported yet')
  }

  const args = []
  const uninterpolatedVariables = (doc.match(/{{([A-Za-z0-9]*)}}/gm) || []).map(
    (str) => str.slice(2, -2)
  )
  // if (uninterpolatedVariables) {
  //   throw new Error(`uninterpolated variables in ${fnName}.glass: ${uninterpolatedVariables.join(', ')}`)
  // }

  args.push(uninterpolatedVariables.map((v) => `${v}: string`))
  console.log(JSON.stringify(uninterpolatedVariables))

  const uninterpolatedKshots =
    doc.match(/^-- \[([A-Za-z0-9]+)\]\.(user|assistant|system)$/gm) || []
  console.log(JSON.stringify(uninterpolatedKshots))
  const transformedKshots = Array.from(uninterpolatedKshots).map((k) => {
    const indexOfParen = k.indexOf('[')
    const indexOfClose = k.indexOf(']')
    const kshotName = k.slice(indexOfParen + 1, indexOfClose)
    return kshotName
  })
  const uniqueKshots = Array.from(new Set(transformedKshots))
  args.push(uniqueKshots.map((k) => `${k}: any[]`))

  const code = `

export function ${functionName}(variables: { ${args.join(', ')} }) {
  return interpolateGlass('${functionName}', variables)
}
`

  const formattedCode = prettier.format(code, {
    parser: 'babel',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5'
  })
  return {code: formattedCode.trim(), args}
}
