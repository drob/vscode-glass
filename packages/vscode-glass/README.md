# [Visual Studio Code](https://code.visualstudio.com) extension for \[Glass]\[]

[![GitHub Actions](https://github.com/foundation-ui/glass-vscode/workflows/main/badge.svg)](https://github.com/foundation-ui/glass-vscode/actions/workflows/main.yml)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/foundation.vscode-glass)](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/foundation.vscode-glass)](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass)
[![Open VSX Version](https://img.shields.io/open-vsx/v/foundation/vscode-glass)](https://open-vsx.org/extension/foundation/vscode-glass)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/foundation/vscode-glass)](https://open-vsx.org/extension/foundation/vscode-glass)

Adds language support for \[Glass]\[].

## Installation

You can install this extension from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass).

## Settings

This extension provides the following settings:

*   `glass.experimentalLanguageServer`: Enable experimental IntelliSense support
    for Glass files.  (`boolean`, default: false)

## Plugins

This extension supports remark syntax plugins.
Plugins can be defined in an array of strings or string / options tuples.
These plugins can be defined in `tsconfig.json` and will be resolved relative to
that file.

For example, to support [frontmatter][] with YAML and TOML and [GFM][]:

```jsonc
{
  "compilerOptions": {
    // …
  },
  "glass": {
    "plugins": [
      [
        "remark-frontmatter",
        ["toml", "yaml"]
      ],
      "remark-gfm"
    ]
  }
}
```

For a more complete list, see [remark plugins][].

## Integration With [VS Code ESLint](https://github.com/microsoft/vscode-eslint)

1.  First of all, you need to enable [eslint-plugin-mdx][] which makes it
    possible to lint `.glass` files with `ESLint`.

2.  And then you will need to enable ESLint validation for `.glass`
    files like following:

    ```jsonc
    // .vscode/settings.json
    {
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "eslint.options": {
        "extensions": [".js", ".jsx", ".glass", ".ts", ".tsx"]
      },
      "eslint.validate": [
        "glass",
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact"
      ]
    }
    ```

### Markdown Syntax

Markdown Syntax could also be linted via [eslint-plugin-mdx][] and
[remark-lint][] plugins.

> it will read [remark][]’s
> [configuration](https://github.com/remarkjs/remark/tree/main/packages/remark-cli#remark-cli)
> automatically via [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).
> But `.remarkignore` will not be respected, you should use `.eslintignore`
> instead.

More usage detail please refer to [eslint-plugin-mdx][]’s [documentation](https://github.com/mdx-js/eslint-mdx#toc-).

## Auto-close tags

If you want VS Code to automatically close tags while you type, you can install
[Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag)
and configure it to also include the language `glass`:

```json
"auto-close-tag.activationOnLanguage": [
  "xml",
  "php",
  "...",
  "glass"
]
```

## Known `vscode-eslint` issues

1.  `Fatal javascript OOM in GC during deserialization`

    ESlint is using VS Code’s old, built-in version of NodeJS (v12) as provided
    by Electron.
    Please add the following setting to use system default Node runtime instead:

    ```json
    {
      "eslint.runtime": "node"
    }
    ```

    Please visit
    [microsoft/vscode-eslint#1498 (comment)](https://github.com/microsoft/vscode-eslint/issues/1498#issuecomment-1175813839)
    as reference for details.

2.  `JavaScript heap out of memory`

    The default memory limit of Node.js is `1G`, please add the following
    setting to increase the limit:

    ```json
    {
      "eslint.execArgv": ["--max_old_space_size=8192"]
    }
    ```

    Please visit
    [microsoft/vscode-eslint#733](https://github.com/microsoft/vscode-eslint/issues/733)
    as reference for details.

## License

[MIT][] © [Foundation][]

[foundation]: https://foundation-ui.com

[eslint-plugin-mdx]: https://github.com/mdx-js/eslint-mdx

[frontmatter]: https://github.com/remarkjs/remark-frontmatter

[gfm]: https://github.com/remarkjs/remark-gfm

[mit]: http://opensource.org/licenses/MIT

[remark]: https://github.com/remarkjs/remark

[remark-lint]: https://github.com/remarkjs/remark-lint

[remark plugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md
