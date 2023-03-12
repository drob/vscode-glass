# `@glass-lang/language-service`

## What is this?

This package provides a [language server][lsp] for [Glass][].
The language server provides IntelliSense based on [TypeScript][], as well as
some markdown specific features.

## When should I use this?

You can use this package if you want to enhance your editor with IntelliSense
for [Glass][] files.
Some editors can consume this package directly, others need a plugin in order to
consume this package.

## Install

This package is not published yet.

## Use

How to use this package depends on your editor integration.

This package provides the CLI `glass-language-server`.
Because this is based on [`vscode-languageserver`][vscode-languageserver], the
same transports are supported.

## Language server features

This language server supports the following features:

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
For example:

<!-- prettier-ignore -->

```glass
{/**
  * @typedef Props
  * @property {string} name
  *   Who to greet.
  */}

# Hello {props.name}
```

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

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This project uses [`vscode-languageserver`][vscode-languageserver] 7, which
implements language server protocol 3.17.0.
It should work anywhere where LSP 3.6.0 or later is implemented.

## Security

This package provides IntelliSense for [Glass][] files.
Some IntelliSense features modify your source code, for example suggestions and
automatic refactors.
It is recommended to keep your source code under version control.

## License

[MIT][] © [Foundation][glass]

[glass]: https://foundation-ui.com

[frontmatter]: https://github.com/remarkjs/remark-frontmatter

[gfm]: https://github.com/remarkjs/remark-gfm

[jsdoc]: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html

[lsp]: https://microsoft.github.io/language-server-protocol

[mit]: LICENSE

[remark plugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md

[typescript]: https://typescriptlang.org

[vscode-languageserver]: https://github.com/microsoft/vscode-languageserver-node/tree/main/server
