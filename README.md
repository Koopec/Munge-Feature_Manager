# Munge feature manager

Munge is a lightweight preprocessor for Java which allows for conditional compilation and aims at producing human-readable source code by preserving comments and formatting.
This extension enables users to create, edit and manage Munge configurations directly within Visual Studio Code.

## Features

1. Translates a configuration to a command in order to compile Java files with Munge and execute it.
2. Finds the minimal config from the model.
3. Config validation against the model.
4. Adds commands/shortcuts to compile with Munge, create a visualization of the model and create a minimal config from the model.

## Usage

The extension can be executed from the source code by pressing `F5` from within the file `extension.js` which will open a new Visual Studio Code window.

The commands below can be executed from the command pallette (`Ctrl+shift+P`) with their respective key combinations/shortcuts:
"Compile with Munge" (`Ctrl+shift+M`): compiles the current Java source file with Munge.
"Create visualization" (`Ctrl+shift+D`): creates a visualization from the model.
"Create minimal config" (`Ctrl+shift+Q`): creates a minimal configuration from the model.

Upon failure, due to missing files or compilation errors, a notification will be shown in Visual Studio Code with the failure message.

## Development

`vsc-extension-quickstart.md` contains an explanation on the development process and links to the documentation of Visual Studio Code.

## Dependencies
`viz.js`