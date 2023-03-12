# `@glass-lang/language-service`

## What is this?

This package implements the logic needed to provide [Glass][] IntelliSense.
This is done by wrapping the [TypeScript][] language service.

## When should I use this?

This package is intended for use by `@glass-lang/monaco` and `@glass-lang/language-server`.
It’s not intended for external usage.

## Install

This package is not published yet.

## API

This package exports the identifier `createGlassLanguageService`.
There is no default export.

### `createGlassLanguageService(ts, host[, plugins])`

Create a [TypeScript][] language service that can handle [Glass][].

#### Parameters

*   `ts`: The TypeScript module.
*   `host`: The TypeScript language service host.
*   `plugins`: A list of remark syntax plugins.
    Only syntax plugins are supported.
    Transformers are unused.

#### Returns

A [TypeScript][] language service that can handle [Glass][].

## Types

This package does not expose [TypeScript][] types, because it’s not intended for
external use.

## Security

This package provides IntelliSense for [Glass][] files.
Some IntelliSense features modify your source code, for example suggestions and
automatic refactors.
It is recommended to keep your source code under version control.

## License

[MIT][] © [Foundation][glass]

[glass]: https://foundation-ui.com

[mit]: LICENSE

[typescript]: https://typescriptlang.org
