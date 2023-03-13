// @ts-nocheck
/**
 * @typedef {import('vscode').ExtensionContext} ExtensionContext
 */

import camelCase from 'camelcase'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {frontmatterFromMarkdown} from 'mdast-util-frontmatter'
import {mdxFromMarkdown, mdxToMarkdown} from 'mdast-util-mdx'
import {toMarkdown} from 'mdast-util-to-markdown'
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

        const genPromptFunctionName = camelCase(
          'get' + fileBase[0].toUpperCase() + fileBase.slice(1) + 'Prompt'
        )

        const newFileName = `${fileBase}.ts` // TODO: allow other languages
        const newFilePath = path.join(folderPath, newFileName)
        const {code, args} = compile(fileContent, genPromptFunctionName)
        fs.writeFileSync(newFilePath, code)

        if (!generateTests) {
          continue
        }

        const newSpecFile = `${fileBase}.spec.ts`
        const newSpecFilePath = path.join(folderPath, newSpecFile)
        const specCode = `import {${genPromptFunctionName}} from './${fileBase}'
import {expect} from 'chai'

describe('${genPromptFunctionName}', () => {
  it('should generate prompt', async () => {
    const result = await ${genPromptFunctionName}(${args
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

function compile(doc, genPromptFunctionName) {
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
  let isAsync = false
  for (const node of tree.children) {
    const async = getParts(node, parts, imports, args)
    if (async) {
      isAsync = true
    }
  }

  const i = imports.join('\n')

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
  const argsString = args
    .map((a) => `${a.name}${language === 'javascript' ? '' : `: ${a.type}`}`)
    .join(', ')
  const code = `// THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

${i ? i + '\n\n' : ''}export ${
    isAsync ? 'async' : ''
  } function ${genPromptFunctionName}(${argsString}) {
    return [
      ${parts.join(',')}
    ].join('').trim()
  }`
  const formattedCode = prettier.format(code, {
    parser: 'babel',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5'
  })
  return {code: formattedCode, args}
}

/**
 * Returns true if the expression is async
 */
function getParts(node, parts, imports, args) {
  let isAsync = false
  switch (node.type) {
    case 'paragraph': {
      const paraParts = []
      for (const child of node.children) {
        const async = getParts(child, paraParts, imports, args)
        if (async) {
          isAsync = true
        }
      }

      for (let i = 0; i < paraParts.length; i++) {
        const paraPart = paraParts[i]
        parts.push(paraPart)
        if (i === paraParts.length - 1) {
          parts.push(JSON.stringify('\n'))
        }
      }

      parts.push(JSON.stringify('\n'))

      break
    }

    case 'text': {
      parts.push(JSON.stringify(node.value))

      break
    }

    case 'mdxTextExpression': {
      if (node.value.startsWith('/*') && node.value.endsWith('*/')) {
        return // just a comment
      }

      const async = node.value.trim().startsWith('await')
      if (async) {
        isAsync = true
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
        parts.push(nodeText)
      } else if (lines.length > 1) {
        const async = nodeText.trim().startsWith('async')
        if (async) {
          isAsync = true
        }
        parts.push(
          `${nodeText.startsWith('async') ? 'await ' : ''}(${nodeText})()`
        )
      }

      parts.push('\n')

      break
    }

    case 'mdxjsEsm': {
      imports.push(node.value)

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

    default:
      let md = toMarkdown(
        {type: 'root', children: [node]},
        {extensions: [mdxToMarkdown()]}
      )

      if (node.type === 'link') {
        md = md.trim() // for some reason the link gets a newline appended
      }
      parts.push(JSON.stringify(md))
      break
  }
  return isAsync
}
