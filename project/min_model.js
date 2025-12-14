const fs = require("fs");
const {loadXML, buildFeatureTree, validateConstraints, validateFeatureTree} = require("./parser.js");
const path = require('path');

// Recursively generates minimal config from the model
//  while keeping a list of all features and list of mandatory features
function gen_min_config(node, mandatory){

    let result = [];
    let selected = [];

    result.push(node.name);
    const select = node.mandatory || mandatory;

    if (select) selected.push(node.name);

    if (node.type === "feature") {
        return [result, selected];
    }

    if (node.type === "and") {
        let x = node.children.flatMap(child => gen_min_config(child, false)[0]);
        let y = node.children.flatMap(child => gen_min_config(child, select)[1]);
        return [result.concat(x) , selected.concat(y)];
    }

    if (node.type === "alt") {
        let x = node.children.flatMap(child => gen_min_config(child, false)[0]);
        let y = node.children.map(child => gen_min_config(child, select)[1])
                            .reduce((a, b) => a.length <= b.length ? a : b);
        return [result.concat(x) , selected.concat(y)];
    }

    if (node.type === "or") {
        let x = node.children.flatMap(child => gen_min_config(child, false)[0]);
        let y = node.children.map(child => gen_min_config(child, select)[1])
                            .reduce((a, b) => a.length <= b.length ? a : b);
        return [result.concat(x) , selected.concat(y)];
    }

    if (node.type === "opt" ) {
        let x = node.children.flatMap(child => gen_min_config(child, false)[0]);
        let y = node.children.flatMap(child => gen_min_config(child, false)[1]);
        return [result.concat(x) , selected];
    }

    return [result, selected];
}

// Collects all hidden features from the feature tree
function get_hidden_features(node){
    let result = [];
    if (node.hidden){
        result.push(node.name);
    }
    if (node.type === "feature"){
        return result;
    }
    return result.concat(node.children.flatMap(child => get_hidden_features(child)));
}

// Creates an XML configuration from the given feature lists
function create_config(features,selected,hidden){
    
    let result = "";
    let hiddens = "";


    features.forEach(feature => {
        if (hidden.includes(feature)){
            hiddens = ' hidden="true"';
        }
        if (selected.includes(feature)) {
            result = result + `\t<feature name="${feature}" manual="selected"${hiddens}/>\n`;
        }
        else{
            result = result + `\t<feature name="${feature}" manual="unselected"${hiddens}/>\n`;
        }
    });
    return `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
${result}
</configuration>`;
}

function allSublists(arr) {
  const result = [[]];

  for (const item of arr) {
    const newSubsets = result.map(subset => [...subset, item]);
    result.push(...newSubsets);
  }

  return result;
}

function try_val(cons,must,features){
    features.sort((a, b) => a.length - b.length);
    for (const item of features){
        const set = new Set(must.concat(item));
        if (validateConstraints(cons, set)){
            return item;
        }
    }
    return [];
}

function try_val_struct(tree,must,features){
    features.sort((a, b) => a.length - b.length);
    for (const item of features){
        const set = new Set(must.concat(item));
        if (validateFeatureTree(tree, set)){
            return item;
        }
    }
    return [];
}

// generates a minimal valid configuration from a feature model
async function min_conf(pathf){

    const featureModelXML = await loadXML(pathf);
    // parsing XML and building the feature tree
    const featureTree = buildFeatureTree(featureModelXML.featureModel.struct[0]);

    // generating an initial minimal configuration
    const minimal = gen_min_config(featureTree, false);
    const features = minimal[0];
    let must_features = minimal[1];
    const hidden = get_hidden_features(featureTree);
    if (featureModelXML.featureModel.constraints != undefined){
        const constraints =  featureModelXML.featureModel.constraints[0];

        let non_must_features = features.filter(x => !must_features.includes(x));

        must_features = must_features.concat(try_val(constraints,must_features, allSublists(non_must_features)));

        non_must_features = non_must_features.filter(x => !must_features.includes(x));

        let new_f = try_val_struct(featureTree, must_features,allSublists(non_must_features));
        must_features = must_features.concat(new_f);
    }
    const conf = create_config(features, must_features,hidden);
    pathf = path.dirname(path.dirname(pathf));
    fs.writeFileSync(pathf +"/configs/config.xml", conf);

    // validating and extending the model using constraints
    let selected_features = new Set(must_features);
    const structureValid = validateFeatureTree(featureTree, selected_features);
    let constraintsValid = true;
    if (featureModelXML.featureModel.constraints != undefined){ 
        const constraints =  featureModelXML.featureModel.constraints[0];
        constraintsValid = validateConstraints(constraints, selected_features);
    }
         
    let result;
    if (structureValid && constraintsValid) {
        result = "CONFIGURATION IS VALID";
    } else {
        result = "CONFIGURATION IS INVALID";
    }
    return result;


}

module.exports = {
  min_conf
};
