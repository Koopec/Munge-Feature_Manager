// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "munge-feature-manager" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('munge-feature-manager.compileWithMunge', function () {

		const parser = new xml2js.Parser();
		const currentDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath
		const xmlPath = path.join(currentDirectory, 'model.xml');
		var xml;

		try {
			xml = fs.readFileSync(xmlPath, 'utf8');
		} catch (error) {
			if (error.code === 'ENOENT') {
				vscode.window.showInformationMessage('model.xml is missing.');
			} else {
				vscode.window.showInformationMessage(error.message);
			}
		}

		parser.parseStringPromise(xml)
			.then(result => {
				const features = result.configuration.feature;
				const selectedFeatures = features.filter(feature => feature.$.manual === 'selected');
				const featureNames = selectedFeatures.map(feature => feature.$.name);

				if (featureNames.length > 0) {

					fs.readdir(currentDirectory, (error, files) => {
						if (error) {
							vscode.window.showInformationMessage(error.message);
							return;
						}

						const javaFiles = files.filter(file => file.endsWith('.java'));
						if (javaFiles.length > 0) {
							const command = `java Munge -D${featureNames.join(' -D')} ${javaFiles.join(' ')}`

							exec(command, (error, stdout, stderr) => {
								if (error) {
									vscode.window.showInformationMessage(error.message);
									return;
								}
								if (stderr) {
									vscode.window.showInformationMessage(error.message);
									return;
								}
							});
						}
					});
				}
			})
			.catch(error => {
				vscode.window.showInformationMessage(error.message);
			});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
