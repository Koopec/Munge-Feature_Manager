# Munge feature manager

Munge is a lightweight preprocessor for Java which allows for conditional compilation and aims at producing human-readable source code by preserving comments and formatting.
This extension enables users to create, edit and manage Munge configurations directly within Visual Studio Code.

## Features

1. Translates a configuration to a command in order to compile Java files with Munge and execute it.
2. Finds the minimal config from the model.
3. Config validation against the model.
4. Adds commands/shortcuts to compile with Munge, create a visualization of the model and create a minimal config from the model.

## Usage

When creating a model the structure should be as follows:
<featureModel>
    <struct>
        Feature tree...
    </struct>
    <constraints>
        <rule>
            Boolean formula...
        </rule>
    </constraints>
</featureModel>

Where nodes in a feature tree can be 'and','or','alt' & 'opt'. All nodes can have from 1 to n children. Leaf nodes are represented as 'feature' and have no children. (To understand this easier press (`Ctrl+shift+U`) and look at the example model). Each node can have 0  to 3 tags, those being 'hidden', 'abstract' and 'mandatory'. When these tags are not present they are considered to be set to 'false'.

There can be 1 or no sets of constraints, if there are constraints:
There can be 1 to n rules (boolean formulas) in constraints, using binary connective 'conj', 'disj', 'imp', 'not' and 'eq'.

The configs have a list like structure where, features are either selected or unselected (which can be changed manyally), some feature may appear with a hidden tag (note this should not be changed manually). Press (`Ctrl+shift+Q`) to construct a minimal valid config for a model.

!Right now the extensions assumes the model is in the model directory with file name 'model.xml' and the config in configs directory with 'config.xml' file name!

The commands below can be executed from the command pallette (`Ctrl+shift+P`) with their respective key combinations/shortcuts:
"Compile with Munge" (`Ctrl+shift+M`): runs the Munge preprocessor on the current Java source file, outputing the result in munge directory (Can be pressed on .java files).
"Compile all with Munge" (`Ctrl+shift+A`): runs the Munge preprocessor on all Java source files in the 'src' directory, outputing the results in 'munge' directory (Can be pressed any time).
"Create visualization" (`Ctrl+shift+D`): creates a visualization from the model.xml or config.xml, in their corresponding directories (Can be pressed on 'model/model.xml' or 'configs/config.xml').
"Create minimal config" (`Ctrl+shift+Q`): creates a minimal valid configuration from the model and puts the resulting file in configs directory (Can be pressed on 'model/model.xml').
"Create directory structure" (`Ctrl+shift+U`): creates a directory structure needed for the use of the feature manager along with an example model (Can be pressed anytime).

Upon failure, due to missing files or compilation errors, a notification will be shown in Visual Studio Code with the failure message.

After running the preprocessor, the generated files might complain about being in a wrong package, to fix this just reload the window.

## Development
This project is fully open-source and any contributions are welcome.

## Contributors
Matej Hora, Michael Schrijer, Thijs van de Griendt

## Dependencies
Munge.java is compiled once the extension is activated, so 'javac' is required. For this any JDK should suffice (Extension Pack for Java, reccomended). 