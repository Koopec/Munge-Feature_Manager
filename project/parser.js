const fs = require("fs");
const { parseStringPromise } = require("xml2js");

async function loadXML(filePath) {
  const data = fs.readFileSync(filePath, "utf-8");
  return await parseStringPromise(data);
}

function explodeArrayObjects(arr) {
  const result = [];

  arr.forEach(obj => {
     Object.entries(obj).forEach(([key, value]) => {

      if (Array.isArray(value) && value.length >= 1) {
      // explode into multiple objects
      value.forEach(v => result.push({ [key]: [v] }));
      } else {
      // leave unchanged
      result.push(obj);
      }
     })
  });

  return result;
} 


function buildFeatureTree(node) {

  if (node.feature) {
    return { name: node.$.name, type: "feature" };
  }

  if (node.and) {
    const andNode = node.and[0];
    const children = [];

    if (andNode.feature) {
      andNode.feature.forEach(f =>
        children.push({ name: f.$.name, type: "feature" })
      );
    }

    if (andNode.alt) {
      andNode.alt.forEach(a =>
        children.push(buildFeatureTree({ alt: [a] }))
      );
    }

    if (andNode.or) {
      andNode.or.forEach(o =>
        children.push(buildFeatureTree({ or: [o] }))
      );
    }

     if (andNode.and) {
      andNode.and.forEach(o =>
        children.push(buildFeatureTree({ and: [o] }))
      );
    }

    return {
      name: andNode.$.name,
      type: "and",
      mandatory: andNode.$.mandatory === "true",
      abstract: andNode.$.abstract === "true",
      hidden: andNode.$.hidden === "true",
      children
    };
  }

  if (node.alt) {
    const altNode = node.alt[0];
    const children = [];

    if (altNode.feature) {
      altNode.feature.forEach(f =>
        children.push({ name: f.$.name, type: "feature" })
      );
    }

    if (altNode.alt) {
      altNode.alt.forEach(a =>
        children.push(buildFeatureTree({ alt: [a] }))
      );
    }

    if (altNode.or) {
      altNode.or.forEach(o =>
        children.push(buildFeatureTree({ or: [o] }))
      );
    }

     if (altNode.and) {
      altNode.and.forEach(o =>
        children.push(buildFeatureTree({ and: [o] }))
      );
    }

    return {
      name: altNode.$.name,
      type: "alt",
      mandatory: altNode.$.mandatory === "true",
      abstract: altNode.$.abstract === "true",
      hidden: altNode.$.hidden === "true",
      children
    };
  }

  if (node.or) {
    const orNode = node.or[0];
    const children = [];

    if (orNode.feature) {
      orNode.feature.forEach(f =>
        children.push({ name: f.$.name, type: "feature" })
      );
    }

    if (orNode.alt) {
      orNode.alt.forEach(a =>
        children.push(buildFeatureTree({ alt: [a] }))
      );
    }

    if (orNode.or) {
      orNode.or.forEach(o =>
        children.push(buildFeatureTree({ or: [o] }))
      );
    }
    
     if (orNode.and) {
      orNode.and.forEach(o =>
        children.push(buildFeatureTree({ and: [o] }))
      );
    }

    return {
      name: orNode.$.name,
      type: "or",
      mandatory: orNode.$.mandatory === "true",
      abstract: orNode.$.abstract === "true",
      hidden: orNode.$.hidden === "true",
      children
    };
  }

  return null;
}

function getSelectedFeatures(config) {
  const selected = new Set();
  config.configuration.feature.forEach(f => {
    const autoSelected = f.$.automatic === "selected";
    const manualSelected = f.$.manual === "selected";
    if (autoSelected || manualSelected) selected.add(f.$.name);
  });
  return selected;
}

function validateFeatureTree(node, selected) {

  if (node.type === "feature") {
    if (node.mandatory && !selected.has(node.name)) return false;
    return true;
  }

  if (node.type === "and") {
    // if the AND node itself is mandatory but not selected
    if (node.mandatory && !selected.has(node.name)) return false;
    return node.children.every(child =>
      validateFeatureTree(child, selected)
    );
  }

  if (node.type === "alt") {
    const selectedChildren = node.children.filter(c =>
      selected.has(c.name)
    );
    if (selectedChildren.length === 1){
      return selectedChildren.every(child => validateFeatureTree(child,selected));
    }
    else{
      return false;
    }
  }

  if (node.type === "or") {
    const selectedChildren = node.children.filter(c =>
      selected.has(c.name)
    );
    if (selectedChildren.length >= 1){
      return selectedChildren.every(child => validateFeatureTree(child,selected));
    }
    else{
      return false;
    }
  }

  return true;
}

// Evaluate a constraint expression recursively
function evalExpr(expr, selected) {

  // VARIABLE
   if (expr.var) {
    return selected.has(expr.var[0]);
  }

  // NOT
  if (expr.not) {
    return !evalExpr(expr.not[0], selected);
  }

  // CONJUNCTION
   if (expr.conj) {
    const [left, right] = explodeArrayObjects(expr.conj);
    return evalExpr(left, selected) && evalExpr(right, selected);
  }

  // DISJUNCTION
  if (expr.disj) {
    const [left, right] = explodeArrayObjects(expr.disj);
    return evalExpr(left, selected) || evalExpr(right, selected);
  }

  // IMPLICATION
  if (expr.imp) {
    const [left, right] = explodeArrayObjects(expr.imp);
    return !evalExpr(left, selected) || evalExpr(right, selected);
  }

  // EQUIVALENCE
  if (expr.eq) {
    const [left, right] = explodeArrayObjects(expr.eq);
    return evalExpr(left, selected) === evalExpr(right, selected);
  }

  return true;
}



/**
 * Validate constraints
 * @param {any} constraints
 * @param {Set<string>} selected
 * @returns {boolean}
 */
function validateConstraints(constraints, selected) {
  if (!constraints || !constraints.rule) return true;

  return constraints.rule.every(rule => {
    const expr = rule;   // each rule is a top-level expression
    return evalExpr(expr, selected);
  });
}

/**
 * Run validation process
 */
async function validate() {
  const featureModelXML = await loadXML("fakka.xml");
  const configXML = await loadXML("Hello.xml");


  const featureTree = buildFeatureTree(featureModelXML.featureModel.struct[0]);
  const selectedFeatures = getSelectedFeatures(configXML);

  const structureValid = validateFeatureTree(featureTree, selectedFeatures);
  const constraintsValid = true;
  if (featureModelXML.featureModel.constraints != undefined){ 
    const constraints =  featureModelXML.featureModel.constraints[0];
    const constraintsValid = validateConstraints(constraints, selectedFeatures);
  }
  
    
  let result;
  if (structureValid && constraintsValid) {
    result = "CONFIGURATION IS VALID";
  } else {
     result = "CONFIGURATION IS INVALID";
  }
  console.log(result);
  return result;
}

async function main (){
  validate();
}

module.exports = {
  loadXML,
  explodeArrayObjects,
  buildFeatureTree,
  getSelectedFeatures,
  validateFeatureTree,
  validateConstraints,
  validate
};

main();