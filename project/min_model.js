const fs = require("fs");
const {loadXML, buildFeatureTree} = require("./parser.js");

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


async function min_conf(pathf){

    const featureModelXML = await loadXML("model.xml");
    const featureTree = buildFeatureTree(featureModelXML.featureModel.struct[0]);

    const minimal = gen_min_config(featureTree, false);
    console.log(minimal[0]);
    console.log(minimal[1]);

    const conf = create_config(minimal[0], minimal[1]);

    fs.writeFileSync("config.xml", conf);
    
}

min_conf();