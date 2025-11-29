const fs = require("fs");
const {loadXML, buildFeatureTree, validateConstraints, validateFeatureTree} = require("./parser.js");


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

function create_config(features,selected){
    
    let result = "";

    features.forEach(feature => {
        if (selected.includes(feature)) {
            result = result + `\t<feature name="${feature}" manual="selected"/>\n`;
        }
        else{
            result = result + `\t<feature name="${feature}" manual="unselected"/>\n`;
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

    for (const item of features){
        const set = new Set(must.concat(item));
        if (validateConstraints(cons, set)){
            return item;
        }
    }
    return [];
}

function try_val_struct(tree,must,features){

    for (const item of features){
        const set = new Set(must.concat(item));
        if (validateFeatureTree(tree, set)){
            return item;
        }
    }
    return [];
}

async function min_conf(pathf){

    const featureModelXML = await loadXML("model.xml");
    const featureTree = buildFeatureTree(featureModelXML.featureModel.struct[0]);

    const minimal = gen_min_config(featureTree, false);
    const features = minimal[0];
    let must_features = minimal[1];
    const constraints =  featureModelXML.featureModel.constraints[0];

    let non_must_features = features.filter(x => !must_features.includes(x));

    must_features = must_features.concat(try_val(constraints,must_features, allSublists(non_must_features)));

    non_must_features = non_must_features.filter(x => !must_features.includes(x));

    let new_f = try_val_struct(featureTree, must_features,allSublists(non_must_features));

    must_features = must_features.concat(new_f);
    console.log(must_features);
    const conf = create_config(features, must_features);

    fs.writeFileSync("config.xml", conf);
    

}

min_conf();