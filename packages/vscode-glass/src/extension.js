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
import * as vscode from 'vscode'
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
  const generateClient = workspace
    .getConfiguration('glass')
    .get('generateClient')

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

  function processFile(filePath) {
    const file = filePath.split('/').slice(-1)[0]
    const folderPath = filePath.split('/').slice(0, -1).join('/')
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively process files in subdirectory
      processFilesInFolder(filePath)
    } else if (path.extname(file) === `.${extension}`) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const fileBase = path.basename(file, `.${extension}`)

      const functionName = camelCase(
        'get' + fileBase[0].toUpperCase() + fileBase.slice(1)
      )

      const newFileName = `${fileBase}.ts` // TODO: allow other languages
      const newFilePath = path.join(folderPath, newFileName)

      // Transpile the glass file to the target language.
      const {code, args} = compile(fileContent, functionName, generateClient)
      fs.writeFileSync(newFilePath, code)

      if (!generateTests) {
        return
      }

      const newSpecFile = `${fileBase}.spec.ts`
      const newSpecFilePath = path.join(folderPath, newSpecFile)
      const specCode = `import {${functionName}} from './${fileBase}'
import {expect} from 'chai'

describe('${functionName}', () => {
it('should generate prompt', async () => {
  const result = await ${functionName}(${args
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

  function processFilesInFolder(folderPath) {
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      processFile(filePath)
    }
  }

  context.subscriptions.push(
    commands.registerCommand('glass.transpileAll', () => {
      const workspaceFolders = workspace.workspaceFolders
      if (workspaceFolders) {
        for (const workspaceFolder of workspaceFolders) {
          const folderPath = workspaceFolder.uri.fsPath
          processFilesInFolder(folderPath)
        }
      }
    }),
    commands.registerCommand('glass.transpileCurrentFile', () => {
      let editor = vscode.window.activeTextEditor
      if (editor) {
        let document = editor.document
        let filePath = document.uri.fsPath
        try {
          processFile(filePath)
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

function compile(doc, functionName, generateClient) {
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
  const params = {}
  let isAsync = false
  for (const node of tree.children) {
    const async = getParts(node, parts, imports, args, params)
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
    .map(
      (a) =>
        `${a.name}${
          language === 'javascript' ? '' : `${a.optional ? '?' : ''}: ${a.type}`
        }`
    )
    .join(', ')
  const fullArgString = args.length ? `args: { ${argsString} }` : ''

  let clientCode = ''
  const defaultTemperature = workspace
    .getConfiguration('glass')
    .get('defaultTemperature')
  if (generateClient) {
    clientCode = `export async function ${functionName}(${fullArgString}) {
      const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))
      const prompt = ${functionName}Prompt(${fullArgString ? 'args' : ''})
      const completion = await openai.createCompletion({
        prompt,
        model: '${params.model || 'text-davinci-003'}',
        temperature: ${params.temperature || defaultTemperature},
        max_tokens: ${params.max_tokens},
        stop: ${params.stop ? `'${params.stop}'` : undefined},
      })
      return completion.data.choices[0].text
}`
  }
  const code = `// THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

${generateClient ? `import { Configuration, OpenAIApi } from 'openai'` : ''}

${i ? i + '\n\n' : ''}

export ${
    isAsync ? 'async' : ''
  } function ${functionName}Prompt(${fullArgString}) {
  ${argsString ? `const {${args.map((a) => a.name).join(',')}} = args` : ''}
  return [
    ${parts.join(',')}
  ].join('').trim()
}

${clientCode}
`
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
function getParts(node, parts, imports, args, params) {
  let isAsync = false
  switch (node.type) {
    case 'paragraph': {
      const paraParts = []
      for (const child of node.children) {
        const async = getParts(child, paraParts, imports, args, params)
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
        if (line.trim() === '') {
          continue
        }
        const [name, rest] = line.split(/:\s+/)
        if (
          name === 'temperature' ||
          name === 'stop' ||
          name === 'max_tokens' ||
          name === 'model'
        ) {
          params[name] =
            name === 'temperature' || name === 'max_tokens'
              ? parseFloat(rest)
              : rest
          continue
        }
        if (name === 'returns') {
          continue
        }

        const [type, description] = rest.split(/\s+/)
        const optional = type.endsWith('?')
        const normType = optional ? type.slice(0, -1) : type
        args.push({name, type: normType, description, optional})
      }

      break
    }

    case 'toml': {
      // Do nothing, for now
      const lines = node.value.split('\n')
      for (const line of lines) {
        if (line.trim() === '') {
          continue
        }
        const [name, rest] = line.split(/:\s+/)
        if (
          name === 'temperature' ||
          name === 'stop' ||
          name === 'max_tokens' ||
          name === 'model'
        ) {
          params[name] =
            name === 'temperature' || name === 'max_tokens'
              ? parseFloat(rest)
              : rest
          continue
        }
        if (name === 'returns') {
          continue
        }

        const [type, description] = rest.split(/\s+/)
        const optional = type.endsWith('?')
        const normType = optional ? type.slice(0, -1) : type
        args.push({name, type: normType, description, optional})
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
