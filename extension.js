// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const xml2js = require('xml2js');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "munge-feature-manager" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('munge-feature-manager.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
		<configuration>
			<feature automatic="selected" name="HelloWorld"/>
			<feature automatic="selected" manual="selected" name="Feature"/>
			<feature manual="selected" name="Wonderful"/>
			<feature automatic="unselected" name="Beautiful"/>
			<feature automatic="selected" manual="selected" name="World"/>
		</configuration>`;

		const parser = new xml2js.Parser();

		parser.parseStringPromise(xml)
			.then(result => {

				const features = result.configuration.feature;

				const selectedFeatures = features.filter(feature => feature.$.manual === 'selected');

				selectedFeatures.forEach(feature => {
					console.log(feature.$.name);
				});
			})
			.catch(err => {
				console.error(err);
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
