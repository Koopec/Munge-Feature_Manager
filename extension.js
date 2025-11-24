// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function readXml(currentDirectory, filename) {
	const xmlPath = path.join(currentDirectory, filename);
	var xml;

	try {
		xml = fs.readFileSync(xmlPath, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			vscode.window.showErrorMessage(`${filename} is missing.`);
		} else {
			vscode.window.showErrorMessage(error.message);
		}
	}
	return xml
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "munge-feature-manager" is now active!');
	const currentDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const extensionPath = path.join(__dirname, '.');
	const command = `javac Munge.java`

	exec(command, {cwd: extensionPath}, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage(error.message);
			return;
		}
		if (stderr) {
			vscode.window.showErrorMessage(error.message);

			return;
		}
		if (stdout) {
			vscode.window.showInformationMessage(stdout);

		}
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const compileWithMunge = vscode.commands.registerCommand('munge-feature-manager.compileWithMunge', function () {

		const parser = new xml2js.Parser();
		const model = readXml(currentDirectory, 'model.xml');

		parser.parseStringPromise(model)
			.then(result => {
				const features = result.configuration.feature;
				const selectedFeatures = features.filter(feature => feature.$.manual === 'selected');
				const featureNames = selectedFeatures.map(feature => feature.$.name);

				if (featureNames.length > 0) {

					fs.readdir(currentDirectory, (error, files) => {
						if (error) {
							vscode.window.showErrorMessage(error.message);
							return;
						}

						const javaFiles = files.filter(file => file.endsWith('.java')).map(file => path.join(currentDirectory, file));
						const mungePath = path.join(extensionPath, 'Munge');
						if (javaFiles.length > 0) {
							const command = `java "${mungePath}" -D${featureNames.join(' -D')} ${javaFiles.join(' ')}`

							exec(command, (error, stdout, stderr) => {
								if (error) {
									vscode.window.showErrorMessage(error.message);
									return;
								}
								if (stderr) {
									vscode.window.showErrorMessage(error.message);
									return;
								}
								if (stdout) {
									vscode.window.showErrorMessage(stdout);
								}
							});
						vscode.window.showInformationMessage('Successfully compiled with Munge.');
						}
					});
				}
			})
			.catch(error => {
				vscode.window.showErrorMessage(error.message);
			});
	});

	const createVisualization = vscode.commands.registerCommand('munge-feature-manager.createVisualization', function () {
		vscode.window.showInformationMessage('Hello world!');
	});

	context.subscriptions.push(compileWithMunge);
	context.subscriptions.push(createVisualization);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
