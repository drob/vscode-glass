// @ts-nocheck
/**
 * @typedef {import('vscode').ExtensionContext} ExtensionContext
 */

import {fromMarkdown} from 'mdast-util-from-markdown'
import {frontmatterFromMarkdown} from 'mdast-util-frontmatter'
import {mdxFromMarkdown} from 'mdast-util-mdx'
import {frontmatter} from 'micromark-extension-frontmatter'
import {mdxjs} from 'micromark-extension-mdxjs'
import * as fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import {commands, workspace} from 'vscode'
import {LanguageClient} from 'vscode-languageclient/node.js'

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
  const generateTests = workspace.getConfiguration('glass').get('generateTests')

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

  function processFilesInFolder(folderPath) {
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      if (fs.statSync(filePath).isDirectory()) {
        // Recursively process files in subdirectory
        processFilesInFolder(filePath)
      } else if (path.extname(file) === `.${extension}`) {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const fileBase = path.basename(file, `.${extension}`)
        const newFileName = `${fileBase}.ts` // TODO: allow other languages
        const newFilePath = path.join(folderPath, newFileName)
        const {code, args} = compile(fileContent, fileBase)
        fs.writeFileSync(newFilePath, code)

        if (!generateTests) {
          continue
        }

        const newSpecFile = `${fileBase}.spec.ts`
        const newSpecFilePath = path.join(folderPath, newSpecFile)
        const specCode = `import {${fileBase}} from './${fileBase}'
import {expect} from 'chai'

describe('${fileBase}', () => {
  it('should generate prompt', async () => {
    const result = await ${fileBase}(${args
          .map((a) => (a.type === 'string' ? '""' : '0'))
          .join(', ')})
    expect(result).to.equal('something')
  })
})
`
        // If newSpecFilePath doesn't exist, create it
        if (!fs.existsSync(newSpecFilePath)) {
          const formattedCode = prettier.format(specCode, {
            parser: 'babel',
            semi: true,
            singleQuote: true,
            trailingComma: 'es5'
          })
          fs.writeFileSync(newSpecFilePath, formattedCode)
        }
      }
    }
  }

  const disposable = commands.registerCommand('glass.transpileAll', () => {
    const workspaceFolders = workspace.workspaceFolders
    if (workspaceFolders) {
      for (const workspaceFolder of workspaceFolders) {
        const folderPath = workspaceFolder.uri.fsPath
        processFilesInFolder(folderPath)
      }
    }
  })
  context.subscriptions.push(disposable)

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

function compile(doc, fileBaseName) {
  const tree = fromMarkdown(doc, {
    extensions: [mdxjs(), frontmatter(['yaml', 'toml'])],
    mdastExtensions: [
      mdxFromMarkdown(),
      frontmatterFromMarkdown(['yaml', 'toml'])
    ]
  })

  const parts = []
  const imports = []
  const args = []
  for (const node of tree.children) {
    getParts(node, parts, imports, args)
  }

  const i = imports.join('\n')

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

  const argsString = args.map((a) => `${a.name}: ${a.type}`).join(', ')
  const code = `// THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

${i ? i + '\n\n' : ''}export async function ${fileBaseName}(${argsString}) {
    const parts = []
    ${parts.join('\n  ')}
    return parts.join('')
  }`
  const formattedCode = prettier.format(code, {
    parser: 'babel',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5'
  })
  return {code: formattedCode, args}
}

function getParts(node, parts, imports, args) {
  switch (node.type) {
    case 'paragraph': {
      const paraParts = []
      for (const child of node.children) {
        getParts(child, paraParts, imports, args)
      }

      for (const paraPart of paraParts) {
        parts.push(`parts.push(${paraPart})`)
      }

      parts.push(`parts.push('\\n')`) // End the paragraph

      break
    }

    case 'text': {
      parts.push(JSON.stringify(node.value))

      break
    }

    case 'mdxTextExpression': {
      if (node.value.startsWith('/*') && node.value.endsWith('*/')) {
        return
      }

      parts.push(node.value)

      break
    }

    case 'mdxFlowExpression': {
      const nodeText = node.value.trim()
      // If nodeText looks like a javascript comment block (e.g. /* */) ignore it
      if (nodeText.startsWith('/*') && nodeText.endsWith('*/')) {
        return
      }

      const lines = nodeText.split('\n')
      if (lines.length === 1) {
        parts.push(`parts.push(${nodeText})`)
      } else if (lines.length > 1) {
        parts.push(
          `parts.push(${
            nodeText.startsWith('async') ? 'await ' : ''
          }(${nodeText})())`
        )
      }

      parts.push(`parts.push('\\n')`)

      break
    }

    case 'mdxjsEsm': {
      imports.push(node.value)

      break
    }

    case 'code': {
      parts.push(
        `parts.push('\`\`\`${node.lang || ''}\\n')`,
        `parts.push(${JSON.stringify(node.value)})`,
        `parts.push('\`\`\`\\n')`
      )
      // Code block, the value doesn't include any fo the tick wrappers and we need to preserve them, so add them back.

      break
    }

    case 'thematicBreak': {
      // Do nothing
      break
    }

    case 'heading': {
      // Do nothing
      break
    }

    case 'yaml': {
      // Do nothing, for now
      const lines = node.value.split('\n')
      for (const line of lines) {
        const [name, rest] = line.split(/:\s+/)
        if (name === 'returns' || name === 'temperature') {
          continue
        }

        const [type, description] = rest.split(/\s+/)
        args.push({name, type, description})
      }

      break
    }

    case 'toml': {
      // Do nothing, for now
      const lines = node.value.split('\n')
      for (const line of lines) {
        const [name, rest] = line.split(/:\s+/)
        if (name === 'returns' || name === 'temperature') {
          continue
        }

        const [type, description] = rest.split(/\s+/)
        args.push({name, type, description})
      }

      break
    }

    default: {
      console.log(JSON.stringify(node, null, 2))
      throw new Error('unhandled node type: ' + node.type)
    }
  }
}
