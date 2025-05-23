# CodeStruct VS Code Extension

A comprehensive VS Code extension for CodeStruct notation that provides syntax highlighting, language server features, and rich IDE support.

## Features

### 🎨 Syntax Highlighting
- Rich syntax highlighting for CodeStruct (`.cst`, `.cstxt`) files
- Support for CodeMap (`.codemap`, `.codemap.yml`) files
- Custom file icons for better visual identification

### 🚀 Language Server Protocol (LSP) Features
- **Real-time Diagnostics**: Syntax error detection and linting
- **Code Completion**: Smart completions for entity keywords, attributes, and values
- **Hover Information**: Rich documentation on hover for keywords and entities
- **Document Symbols**: Outline view and navigation for CodeStruct files
- **Code Actions**: Quick fixes and refactoring suggestions
- **Document Formatting**: Automatic code formatting and indentation

## Installation

### Prerequisites

1. **Python 3.9+** with the `codestruct` package installed:
   ```bash
   pip install codestruct
   ```

2. **VS Code 1.60.0+**

### Install the Extension

1. Download the latest `.vsix` file from the releases
2. Install via VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Extensions: Install from VSIX"
   - Select the downloaded `.vsix` file

Or install from the VS Code Marketplace (when published):
```bash
code --install-extension SarthakMishra.codestruct
```

## Configuration

The extension can be configured through VS Code settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `codestruct.server.enabled` | boolean | `true` | Enable the language server |
| `codestruct.server.pythonPath` | string | `""` | Python interpreter path (auto-detected if empty) |
| `codestruct.server.cwd` | string | `""` | Working directory for the server (defaults to workspace root) |
| `codestruct.server.debug` | boolean | `false` | Enable debug mode for the language server |
| `codestruct.server.debugHost` | string | `"localhost"` | Debug host for language server debugging |
| `codestruct.server.debugPort` | number | `6009` | Debug port for language server debugging |
| `codestruct.linting.enabled` | boolean | `true` | Enable linting diagnostics |
| `codestruct.formatting.enabled` | boolean | `true` | Enable document formatting |
| `codestruct.completion.enabled` | boolean | `true` | Enable code completion |
| `codestruct.trace.server` | string | `"off"` | Trace communication with server (`off`, `messages`, `verbose`) |
| `codestruct.client.documentSelector` | array | `[...]` | Document selector for server activation |

### Example Settings

Add to your VS Code `settings.json`:

```json
{
  "codestruct.server.enabled": true,
  "codestruct.server.debug": false,
  "codestruct.trace.server": "verbose",
  "codestruct.linting.enabled": true,
  "codestruct.formatting.enabled": true,
  "codestruct.completion.enabled": true,
  "[codestruct]": {
    "editor.formatOnSave": true,
    "editor.formatOnType": true
  }
}
```

For a complete example with all available options, see `.vscode/settings.example.json` in the extension directory.

## Usage

### Basic Usage

1. Create a new file with `.cst` or `.cstxt` extension
2. Start writing CodeStruct notation
3. Enjoy syntax highlighting and LSP features!

### Example CodeStruct File

```codestruct
module: MyApplication
  doc: "Main application module"
  
  class: UserService [type: SERVICE]
    doc: "Handles user-related operations"
    
    func: createUser
      doc: "Creates a new user account"
      param: userData [type: OBJECT]
        doc: "User registration data"
      returns: user [type: USER]
        doc: "Created user object"
    
    func: getUserById
      doc: "Retrieves user by ID"
      param: userId [type: STRING]
        doc: "Unique user identifier"
      returns: user [type: USER, optional: true]
        doc: "User object or null if not found"
```

### Language Server Features

#### Code Completion
- Type `:` after entity keywords to get completions
- Type `[` to get attribute completions
- Context-aware suggestions based on current scope

#### Diagnostics
- Real-time syntax error detection
- Style and convention warnings
- Missing documentation alerts

#### Hover Information
- Hover over keywords to see documentation
- Entity definitions and type information
- Attribute explanations

#### Document Symbols
- Use `Ctrl+Shift+O` to open the symbol navigator
- Hierarchical view of your CodeStruct entities
- Quick navigation to any entity

#### Code Actions
- Right-click for quick fixes and refactoring
- Add missing documentation
- Fix naming conventions
- Insert code templates

#### Formatting
- Use `Shift+Alt+F` to format the entire document
- Automatic indentation and style correction

## Troubleshooting

### Language Server Not Starting

1. **Check Python Installation**:
   ```bash
   python --version  # Should be 3.9+
   python -m codestruct.lsp --help  # Should show help
   ```

2. **Check Extension Logs**:
   - Open VS Code Output panel (`View > Output`)
   - Select "CodeStruct Language Server" from the dropdown
   - Look for error messages

3. **Enable Verbose Logging**:
   ```json
   {
     "codestruct.trace.server": "verbose"
   }
   ```

### Common Issues

- **"Failed to start server: spawn python ENOENT"**: Python not in PATH
- **"Module 'codestruct' not found"**: Install codestruct package
- **No completions/diagnostics**: Check if language server is running

### Custom Python Path

If you're using a virtual environment or custom Python installation:

```json
{
  "codestruct.server.path": "/path/to/your/python -m codestruct.lsp"
}
```

## Development

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/SarthakMishra/codestruct-vscode.git
   cd codestruct-vscode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Debug the extension:
   - Press `F5` to launch a new Extension Development Host
   - Open a CodeStruct file to test the features

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/SarthakMishra/codestruct-vscode/issues)
- [CodeStruct Documentation](https://github.com/SarthakMishra/codestruct)

## Changelog

### 0.1.4
- Added Language Server Protocol support
- Implemented code completion, diagnostics, and hover
- Added document symbols and code actions
- Improved syntax highlighting
- Added configuration options for LSP features

### Previous Versions
- Basic syntax highlighting for CodeStruct notation
- File icons and language configuration

## What is CodeStruct?

CodeStruct is a plain-text, human- and machine-readable, language-agnostic notation for describing the structure of software. It captures entities such as modules, classes, functions, parameters, variables, and more, in a concise, hierarchical, and extensible format. CodeStruct is designed for LLM context compression.

## Example

```
dir: project_root
  file: main.py
    module: main
      doc: Entry point for the application...
      import: user
        type: internal
        ref: module: user
      func: main
        doc: Runs the main application logic...
        param: argv [type: LIST]
        returns: None
```

## Minified Format Example

```
d:project_root;f:main.py;m:main;i:user[t:int,rf:m:user];fn:main|p:argv[t:LIST],r:None
```

## File Extensions

This extension supports the following file extensions:
- `.cstxt`
- `.codestruct`
- `.cs.txt`

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. 