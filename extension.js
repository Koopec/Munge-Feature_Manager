// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const parser_js = require('./project/parser.js')
const visual_model = require('./project/visual_model.js');
const visual_config = require('./project/visual_config.js');
const min_config = require('./project/min_model.js');


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

function compile(currentDirectory, extensionPath, javaFilePath) {

    const parser = new xml2js.Parser();
    console.log(currentDirectory)
    const model = readXml(currentDirectory, '/configs/config.xml');

    parser.parseStringPromise(model)
        .then(result => {
            const features = result.configuration.feature;
            const selectedFeatures = features.filter(feature => feature.$.manual === 'selected');
            const featureNames = selectedFeatures.map(feature => feature.$.name);

            if (featureNames.length >= 0) {

                fs.readdir(currentDirectory, (error, files) => {
                    if (error) {
                        vscode.window.showErrorMessage(error.message);
                        return;
                    }

                    if (javaFilePath.endsWith('.java')) {
                        const command = `java Munge -D${featureNames.join(' -D')} "${javaFilePath}"`
                        console.log(command);
                        exec(command, { cwd: extensionPath }, async (error, stdout, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(error.message);
                                return;
                            }
                            if (stderr) {
                                vscode.window.showErrorMessage(error.message);
                                return;
                            }
                            if (stdout) {
                                let valid = await parser_js.validate(currentDirectory + '/configs/config.xml', currentDirectory + '/model/model.xml');

                                if (valid === "CONFIGURATION IS VALID"){
                                    const mungeDirectory = path.join(currentDirectory, 'munge');
                                    if (!fs.existsSync(mungeDirectory)) {
                                        fs.mkdirSync(mungeDirectory);
                                    }

                                    const javaFileName = path.basename(javaFilePath);
                                    const mungePath = path.join(mungeDirectory, javaFileName);
                                    fs.writeFileSync(mungePath, stdout);
                                }
                                else{
                                    vscode.window.showErrorMessage(valid);
                                }
                            }
                        });
                    }
					else{
						vscode.window.showErrorMessage("Not a java file.");
					}
                });
            }
        })
        .catch(error => {
            vscode.window.showErrorMessage(error.message);
        });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "munge-feature-manager" is now active!');
	const currentDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const extensionPath = path.join(__dirname, '.');
	const command = `javac Munge.java`

	exec(command, { cwd: extensionPath }, (error, stdout, stderr) => {
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
        const javaFilePath = vscode.window.activeTextEditor.document.fileName;
        compile(currentDirectory, extensionPath, javaFilePath);
    });
	//compiles all java files with munge
    const compileAllWithMunge = vscode.commands.registerCommand('munge-feature-manager.compileAllWithMunge', function () {
        
        const fs = require('fs');
    
        fs.readdir(currentDirectory + "/src", (err, files) => {
          if (err) {
            return console.error('Unable to scan directory:', err);
          }
        
          files.forEach(file => {
            console.log("Found file:", file);
            const javaFilePath = currentDirectory + "/src/" + file
            compile(currentDirectory, extensionPath, javaFilePath)
          });
        });

	});
	//creates config or model visualization
	const createVisualization = vscode.commands.registerCommand('munge-feature-manager.createVisualization', async function () {
		const currentDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const editor = vscode.window.activeTextEditor;
		if (!editor){
			vscode.window.showErrorMessage("File editor not opened!");
		}
		else{
			const filePath = editor.document.uri.fsPath;
			const fileDir = path.dirname(filePath);
			const parentDir = path.basename(fileDir);

			if (parentDir === "model") {
				console.log(filePath);
				await visual_model.visualize(filePath);
				const uri = vscode.Uri.file(fileDir + "/featureTree.svg");
				await vscode.commands.executeCommand(
					"vscode.openWith",
					uri,
					"imagePreview.previewEditor",
					{ viewColumn: vscode.ViewColumn.Beside }
				);
			}
			else if (parentDir === "configs") {
				console.log(filePath);
				await visual_config.visualize(filePath);
				const uri = vscode.Uri.file(fileDir + "/config.svg");
				await vscode.commands.executeCommand(
					"vscode.openWith",
					uri,
					"imagePreview.previewEditor",
					{ viewColumn: vscode.ViewColumn.Beside }
				);
			}
			else {
				vscode.window.showErrorMessage("Current file not model or config directory.");
			}
		}
	});
	// creates a minimal valid config from the model
	const createMinConfig = vscode.commands.registerCommand('munge-feature-manager.createMinConfig', async function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor){
			vscode.window.showErrorMessage("File editor not opened!");
		}
		else{
			const filePath = editor.document.uri.fsPath;
			const fileDir = path.dirname(filePath);
			if (filePath === fileDir + "/model.xml") {
				await min_config.min_conf(filePath);
			}
			else {
                console.log(filePath)
				vscode.window.showErrorMessage("Not a model.xml file in the model directory.");
			}
		}
	});

	// creates default directory structure
	const createDirStructure = vscode.commands.registerCommand('munge-feature-manager.createDirStruct', async function () {
		const mungeDirectory = path.join(currentDirectory, 'munge');

		if (!fs.existsSync(mungeDirectory)) {
			fs.mkdirSync(mungeDirectory);
		}
		const modelDirectory = path.join(currentDirectory, 'model');

		if (!fs.existsSync(modelDirectory)) {
			fs.mkdirSync(modelDirectory);
		}
		if (!fs.existsSync(modelDirectory + '/model.xml')) {
			fs.copyFile(extensionPath + '/model.xml', modelDirectory + '/model.xml', (err) => {
				if (err) {
					vscode.window.showErrorMessage("Cannot copy file: " + err.message);
				}
			});
		} 

		const configsDirectory = path.join(currentDirectory, 'configs');

		if (!fs.existsSync(configsDirectory)) {
			fs.mkdirSync(configsDirectory);
		}
		if (!fs.existsSync(configsDirectory + '/config.xml')) {
			fs.writeFile(configsDirectory + '/config.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<configuration></configuration> ', 
				(err) => { if (err) vscode.window.showErrorMessage("Cannot write to " + modelDirectory + '/config.xml')});
		}

		const srcDirectory = path.join(currentDirectory, 'src');

		if (!fs.existsSync(srcDirectory)) {
			fs.mkdirSync(srcDirectory);
		}
	});

	context.subscriptions.push(createDirStructure);
	context.subscriptions.push(createMinConfig);
	context.subscriptions.push(compileWithMunge);
    context.subscriptions.push(compileAllWithMunge);
	context.subscriptions.push(createVisualization);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
