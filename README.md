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
"Compile with Munge" (`Ctrl+shift+M`): runs the Munge preprocessor on the current Java source file, outputing the result in munge directory.
"Compile all with Munge" (`Ctrl+shift+A`): runs the Munge preprocessor on all Java source files in the 'src' directory, outputing the results in 'munge' directory.
"Create visualization" (`Ctrl+shift+D`): creates a visualization from the model.
"Create minimal config" (`Ctrl+shift+Q`): creates a minimal valid configuration from the model.
"Create directory structure" (`Ctrl+shift+U`): creates a directory structure needed for the use of the feature manager.

Upon failure, due to missing files or compilation errors, a notification will be shown in Visual Studio Code with the failure message.

## Development
This project is fully open-source and any contributions are welcome.

## Contributors
Matej Hora, Michael Schrijer, Thijs van de Griendt

## Dependencies
Munge.java is compiled once the extension is activated, so 'javac' is required. For this any JDK should suffice (Extension Pack for Java, reccomended).