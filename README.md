# Glass for VSCode

[![GitHub Actions](https://github.com/foundation-ui/glass-vscode/workflows/main/badge.svg)](https://github.com/foundation-ui/glass-vscode/actions/workflows/main.yml)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/foundation.vscode-glass)](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/foundation.vscode-glass)](https://marketplace.visualstudio.com/items?itemName=foundation.vscode-glass)
[![Open VSX Version](https://img.shields.io/open-vsx/v/foundation/vscode-glass)](https://open-vsx.org/extension/foundation/vscode-glass)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/foundation/vscode-glass)](https://open-vsx.org/extension/foundation/vscode-glass)

This repository contains the code to provide IntelliSense for [Glass][].

It contains the following workspaces:

*   [`@glass-lang/language-service`][] provides a TypeScript language service
    that can handle Glass files.
*   [`@glass-lang/language-server`][] provides Glass IntelliSense using the
    [Language Server Protocol][].
*   [`@glass-lang/monaco`][] provides Glass IntelliSense for [Monaco editor][].
*   [`vscode-glass`][] provides Glass IntelliSense and basic language support
    for [Visual Studio Code][].

## License

[MIT][] © [Foundation][glass]

[`@glass-lang/monaco`]: https://github.com/foundation-ui/glass-vscode/tree/main/packages/monaco

[`@glass-lang/language-server`]: https://github.com/foundation-ui/glass-vscode/tree/main/packages/language-server

[`@glass-lang/language-service`]: https://github.com/foundation-ui/glass-vscode/tree/main/packages/language-service

[`vscode-glass`]: https://github.com/foundation-ui/glass-vscode/tree/main/packages/vscode-glass

[glass]: https://foundation-ui.com

[language server protocol]: https://microsoft.github.io/language-server-protocol/

[monaco editor]: https://microsoft.github.io/monaco-editor/

[mit]: http://opensource.org/licenses/MIT

[visual studio code]: https://code.visualstudio.com/
