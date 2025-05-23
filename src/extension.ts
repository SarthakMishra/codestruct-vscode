import * as path from 'path';
import { workspace, ExtensionContext, window, OutputChannel, commands, extensions } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    ExecutableOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;
let outputChannel: OutputChannel;

function formatLogMessage(message: string): string {
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return `[Info  - ${timestamp}] ${message}`;
}

function formatErrorMessage(message: string): string {
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return `[Error - ${timestamp}] ${message}`;
}

export function activate(context: ExtensionContext) {
    console.log('CodeStruct extension activation started');

    // Create output channel for logging
    outputChannel = window.createOutputChannel('CodeStruct Language Server');
    context.subscriptions.push(outputChannel);
    outputChannel.appendLine(formatLogMessage('CodeStruct extension activation started'));

    // Register commands immediately when extension activates
    outputChannel.appendLine(formatLogMessage('Registering commands...'));
    registerCommands(context);
    outputChannel.appendLine(formatLogMessage('Commands registered successfully'));

    // Get configuration
    outputChannel.appendLine(formatLogMessage('Getting configuration...'));
    const config = workspace.getConfiguration('codestruct');

    if (!config.get('server.enabled', true)) {
        outputChannel.appendLine(formatLogMessage('CodeStruct Language Server is disabled in settings'));
        return;
    }

    outputChannel.appendLine(formatLogMessage('Starting language server...'));
    startLanguageServer(context).catch(error => {
        outputChannel.appendLine(formatErrorMessage(`Error during language server startup: ${error}`));
        console.error('CodeStruct language server startup error:', error);
    });

    outputChannel.appendLine(formatLogMessage('CodeStruct extension activation completed'));
    console.log('CodeStruct extension activation completed');
}

async function getPythonPath(): Promise<string> {
    const config = workspace.getConfiguration('codestruct');
    const configuredPath = config.get('server.pythonPath', '');

    if (configuredPath) {
        outputChannel.appendLine(formatLogMessage(`Using configured Python path: ${configuredPath}`));
        return configuredPath;
    }

    // Check for virtual environment in workspace first
    const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
        const venvPythonPath = path.join(workspaceRoot, '.venv', 'bin', 'python');
        try {
            // Check if the virtual environment Python exists
            const fs = require('fs');
            if (fs.existsSync(venvPythonPath)) {
                outputChannel.appendLine(formatLogMessage(`Using virtual environment Python: ${venvPythonPath}`));
                return venvPythonPath;
            }
        } catch (error) {
            outputChannel.appendLine(formatLogMessage(`Failed to check virtual environment: ${error}`));
        }
    }

    // Try to get Python path from Python extension (with timeout)
    try {
        outputChannel.appendLine(formatLogMessage('Attempting to get Python path from Python extension...'));
        const pythonExtension = extensions.getExtension('ms-python.python');
        if (pythonExtension) {
            // Set a timeout to avoid hanging
            const activationPromise = pythonExtension.isActive ?
                Promise.resolve() :
                Promise.race([
                    pythonExtension.activate(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]);

            await activationPromise;

            const pythonApi = pythonExtension.exports;
            if (pythonApi && pythonApi.settings) {
                const pythonPath = pythonApi.settings.getExecutionDetails?.()?.execCommand?.[0];
                if (pythonPath) {
                    outputChannel.appendLine(formatLogMessage(`Using Python path from Python extension: ${pythonPath}`));
                    return pythonPath;
                }
            }
        } else {
            outputChannel.appendLine(formatLogMessage('Python extension not found'));
        }
    } catch (error) {
        outputChannel.appendLine(formatErrorMessage(`Failed to get Python path from Python extension: ${error}`));
    }

    // Fallback to 'python'
    outputChannel.appendLine(formatLogMessage('Using fallback Python path: python'));
    return 'python';
}

async function startLanguageServer(context: ExtensionContext) {
    const config = workspace.getConfiguration('codestruct');

    // Get Python path
    const pythonPath = await getPythonPath();
    const serverCommand = `${pythonPath} -m codestruct.lsp`;

    outputChannel.appendLine(formatLogMessage(`Starting CodeStruct Language Server with command: ${serverCommand}`));

    // Parse the server command
    const args = ['-m', 'codestruct.lsp'];

    // Check if debug mode is enabled
    const debugMode = config.get('server.debug', false);
    const debugPort = config.get('server.debugPort', 6009);
    const debugHost = config.get('server.debugHost', 'localhost');

    if (debugMode) {
        args.push('--debug');
        outputChannel.appendLine(formatLogMessage(`Debug mode enabled. Server will listen on ${debugHost}:${debugPort}`));
    }

    // Get working directory
    const cwd = config.get('server.cwd', '');
    const workingDirectory = cwd || (workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd());

    outputChannel.appendLine(formatLogMessage(`Server working directory: ${workingDirectory}`));

    // Set up Python path to include the codestruct source directory
    // If using virtual environment, the package should be installed, so we don't need to add src path
    let pythonPathEnv = process.env.PYTHONPATH || '';

    // Check if we're using a virtual environment
    const isUsingVenv = pythonPath.includes('.venv');

    if (!isUsingVenv) {
        // Only add src path if not using virtual environment
        const codestructSrcPath = path.join(workingDirectory, 'codestruct', 'src');
        pythonPathEnv = pythonPathEnv ? `${codestructSrcPath}:${pythonPathEnv}` : codestructSrcPath;
        outputChannel.appendLine(formatLogMessage(`Adding codestruct src to PYTHONPATH: ${codestructSrcPath}`));
    } else {
        outputChannel.appendLine(formatLogMessage('Using virtual environment - relying on installed codestruct package'));
    }

    if (pythonPathEnv) {
        outputChannel.appendLine(formatLogMessage(`Setting PYTHONPATH to: ${pythonPathEnv}`));
    }

    // Server options for running the CodeStruct language server
    const serverOptions: ServerOptions = {
        command: pythonPath,
        args: args,
        options: {
            cwd: workingDirectory,
            env: {
                ...process.env,
                // Ensure Python can find the codestruct module
                PYTHONPATH: pythonPathEnv
            }
        } as ExecutableOptions
    };

    // Get document selector from configuration
    const documentSelector = config.get('client.documentSelector', [
        { scheme: 'file', language: 'codestruct' },
        { scheme: 'untitled', language: 'codestruct' }
    ]);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for CodeStruct documents
        documentSelector: documentSelector,
        synchronize: {
            // Notify the server about file changes to CodeStruct files
            fileEvents: workspace.createFileSystemWatcher('**/*.{cst,cstxt}')
        },
        // Pass configuration to the server
        initializationOptions: {
            linting: config.get('linting.enabled', true),
            formatting: config.get('formatting.enabled', true),
            completion: config.get('completion.enabled', true)
        },
        // Use our output channel for logging
        outputChannel: outputChannel,
        // Enable tracing based on configuration
        traceOutputChannel: config.get('trace.server') !== 'off' ? outputChannel : undefined
    };

    // Create the language client and start the client
    client = new LanguageClient(
        'codestructLanguageServer',
        'CodeStruct Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start().then(() => {
        outputChannel.appendLine(formatLogMessage('CodeStruct Language Server started successfully'));
    }).catch((error) => {
        const errorMsg = `Failed to start CodeStruct Language Server: ${error.message}`;
        outputChannel.appendLine(formatErrorMessage(errorMsg));
        window.showErrorMessage(errorMsg);
        console.error('Failed to start CodeStruct Language Server:', error);
    });

    // Register configuration change handler
    context.subscriptions.push(
        workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('codestruct')) {
                outputChannel.appendLine(formatLogMessage('Configuration changed, restarting language server...'));
                // Restart the language server when configuration changes
                if (client) {
                    client.stop().then(() => {
                        startLanguageServer(context);
                    });
                }
            }
        })
    );
}

function registerCommands(context: ExtensionContext) {
    // Register restart command (updated command name)
    context.subscriptions.push(
        commands.registerCommand('codestruct.server.restart', () => {
            outputChannel.appendLine(formatLogMessage('Manually restarting language server...'));
            if (client) {
                client.stop().then(() => {
                    startLanguageServer(context);
                });
            } else {
                // If no client exists, try to start one
                startLanguageServer(context);
            }
        })
    );

    // Register command to execute custom server commands (updated command name)
    context.subscriptions.push(
        commands.registerCommand('codestruct.server.executeCommand', async () => {
            if (!client) {
                window.showErrorMessage('Language server is not running');
                return;
            }

            try {
                // Get available commands from the server
                const commands = await client.sendRequest('workspace/executeCommand', {
                    command: 'codestruct.listCommands'
                });

                if (commands && Array.isArray(commands)) {
                    const selectedCommand = await window.showQuickPick(commands, {
                        placeHolder: 'Select a command to execute'
                    });

                    if (selectedCommand) {
                        await client.sendRequest('workspace/executeCommand', {
                            command: selectedCommand
                        });
                        outputChannel.appendLine(formatLogMessage(`Executed command: ${selectedCommand}`));
                    }
                }
            } catch (error) {
                outputChannel.appendLine(formatErrorMessage(`Error executing command: ${error}`));
            }
        })
    );
}

function registerCustomCommands(context: ExtensionContext) {
    // This function is no longer needed as commands are registered in registerCommands
}

export function deactivate(): Thenable<void> | undefined {
    if (outputChannel) {
        outputChannel.appendLine(formatLogMessage('Deactivating CodeStruct Language Server...'));
    }

    if (!client) {
        return undefined;
    }
    return client.stop();
} 