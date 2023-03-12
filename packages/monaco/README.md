# `@glass-lang/monaco`

## What is this?

This package IntelliSense for [Glass][] in [Monaco editor][].
This package provides IntelliSense based on [TypeScript][], as well as some
markdown specific features.

## When should I use this?

You can use this package if you want to integrate IntelliSense for [Glass][]
files in a browser.

## Install

This package is not published yet.

## Use

```js
import { initializeMonacoMdx } from '@glass-lang/monaco'
import * as monaco from 'monaco-editor'

// Register the worker
window.MonacoEnvironment = {
  getWorker(_workerId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/editor/editor.worker.js',
            import.meta.url,
          ),
        )
      case 'json':
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/language/json/json.worker.js',
            import.meta.url,
          ),
        )
      case 'javascript':
      case 'typescript':
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/language/typescript/ts.worker.js',
            import.meta.url,
          ),
        )
      case 'glass':
        return new Worker(
          new URL('@glass-lang/monaco/glass.worker.js', import.meta.url),
        )
      default:
        throw new Error(`Unsupported worker label: ${label}`)
    }
  },
}

// Initialize the Glass IntelliSense
initializeMonacoMdx(monaco)

// Create a model
const content = `
{/**
  * @type {object} Props
  * @property {string} name
  * Who to greet.
  */}

# Hello {props.name}
`

const model = monaco.editor.createModel(
  content,
  undefined,
  monaco.Uri.parse('file:///hello.glass'),
)

// Create the editor
const element = document.getElementById('editor')
const editor = monaco.editor.create(element, { model })
```

By default no plugins included.
To support plugins, you have to create your own worker.
Then, instead of referencing `@glass-lang/monaco/glass.worker.js` in the
`MonacoEnvironment`, reference your own cusotmized worker.

For example, to support [frontmatter][] and [GFM][], create a file named
`glass.worker.js` with the following content:

```js
import {configure} from '@glass-lang/monaco/glass.worker.js'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

configure({
  plugins: [remarkFrontmatter, remarkGfm]
})
```

And make the following change in your `MonacoEnvironment`:

```diff
  import { initializeMonacoMdx } from '@glass-lang/monaco'
  import * as monaco from 'monaco-editor'

  // Register the worker
  window.MonacoEnvironment = {
    getWorker(_workerId, label) {
      switch (label) {
        // …
        case 'glass:
-         return new Worker(new URL('@glass-lang/monaco/glass.worker.js', import.meta.url))
+         return new Worker(new URL('./glass.worker.js', import.meta.url))
        // …
      }
    }
  }
```

## Examples

A [demo][] is available.

## Language features

The language integration supports the following features:

*   Markdown definitions
*   Markdown hover hints
*   TypeScript completions
*   TypeScript definitions
*   TypeScript diagnostics
*   TypeScript hover hints
*   TypeScript references

[Glass][] doesn’t support TypeScript syntax, but it does support
[types in JSDoc][jsdoc].
The special type `Props` is used to determine the type used for `props`.

## Compatibility

This project is compatible with evergreen browsers.
It requires at least `monaco-editor` version `0.34`.
This project is likely to work with later versions of Monaco editor as well, but
this is not guaranteed.

## Types

This package is fully typed with [TypeScript][]

## Security

This package provides IntelliSense for [Glass][] models.
Some IntelliSense features modify your model content, for example suggestions
and automatic refactors.

## See also

*   [monaco-tailwindcss](https://monaco-tailwindcss.js.org)
*   [monaco-unified](https://monaco-unified.js.org)
*   [monaco-yaml](https://monaco-yaml.js.org)

## License

[MIT][] © [Foundation][glass]

[demo]: https://github.com/foundation-ui/glass-vscode/tree/HEAD/demo

[frontmatter]: https://github.com/remarkjs/remark-frontmatter

[glass]: https://foundation-ui.com

[gfm]: https://github.com/remarkjs/remark-gfm

[jsdoc]: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html

[mit]: LICENSE

[monaco editor]: https://github.com/microsoft/monaco-editor

[typescript]: https://typescriptlang.org
