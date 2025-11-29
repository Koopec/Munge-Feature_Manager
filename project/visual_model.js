const fs = require("fs");
const Viz = require("viz.js");
const { Module, render } = require("viz.js/full.render.js");
const { loadXML, explodeArrayObjects, buildFeatureTree } = require("./parser.js");
const path = require('path');

// Map node properties to DOT style
function nodeStyle(node) {
  let color = node.mandatory ? "gold" : "lightblue";
  let shape = "box";
  let label = node.name;
  const flags = [];
  if (node.mandatory) flags.push("M");
  if (node.abstract) flags.push("A");
  if (node.hidden) flags.push("H");
  if (flags.length > 0) label += ` (${flags.join(",")})`;
  return { color, shape, label };
}

// Convert feature tree to Graphviz DOT format
function featureTreeToDot(node) {
  const lines = [];

  function traverse(n, parentName = null, relation = null) {
    const nodeName = `"${n.name}"`;
    const { color, shape, label } = nodeStyle(n);

    lines.push(`${nodeName} [label="${label}", shape=${shape}, style=filled, fillcolor=${color}];`);

    if (parentName) {
      let edgeLabel = "";
      if (relation) edgeLabel = ` [label="${relation}"]`;
      lines.push(`${parentName} -> ${nodeName}${edgeLabel};`);
    }

    if (n.children) {
      n.children.forEach(child => traverse(child, nodeName, n.type));
    }
  }

  traverse(node);

  return `digraph G {
    rankdir=TB;
    graph [size="8,3", ratio=fill];
    node [fontname="Arial"];
    edge [fontsize=10];
    ${lines.join("\n")}
  }`;
}

function constraintToText(expr) {
  // VARIABLE
  if (expr.var) {
    return expr.var[0];
  }

  // NOT
  if (expr.not) {
    return `¬(${constraintToText(expr.not[0])})`;
  }

  // CONJUNCTION (AND)
  if (expr.conj) {
    const [left, right] = explodeArrayObjects(expr.conj);
    return `(${constraintToText(left)} ∧ ${constraintToText(right)})`;
  }

  // DISJUNCTION (OR)
  if (expr.disj) {
    const [left, right] = explodeArrayObjects(expr.disj);
    return `(${constraintToText(left)} ∨ ${constraintToText(right)})`;
  }

  // IMPLICATION
  if (expr.imp) {
    const [left, right] = explodeArrayObjects(expr.imp);
    return `(${constraintToText(left)} → ${constraintToText(right)})`;
  }

  // EQUIVALENCE
  if (expr.eq) {
    const [left, right] = explodeArrayObjects(expr.eq);
    return `(${constraintToText(left)} ↔ ${constraintToText(right)})`;
  }

  return "";
}


function more_constraints(svg,constraints){


  const widthMatch = svg.match(/width="(\d+(?:\.\d+)?)pt"/);
  const width = widthMatch ? parseFloat(widthMatch[1]) : null;

  const heightMatch = svg.match(/height="(\d+(?:\.\d+)?)pt"/);
  const height = heightMatch ? parseFloat(heightMatch[1]) : null;

  let y = -height - 50;
  let x = width - 50;

  constraints.rule.forEach(constraint =>{
    // console.log(constraintToText(constraint));
    svg = svg.replace('</g>\n</svg>',`<text x="${x}" y="${y}" font-size="8" fill="black">${constraintToText(constraint)}</text></g>\n</svg>`);
    y = y + 10;
  } );

  return svg;
}

async function visualize(pathf) {
  const featureModelXML = await loadXML(pathf);
  const featureTree = buildFeatureTree(featureModelXML.featureModel.struct[0]);

  const dot = featureTreeToDot(featureTree);

  const viz = new Viz({ Module, render });
  let svg = await viz.renderString(dot);

  if (featureModelXML.featureModel.constraints != undefined){
    const constraints = featureModelXML.featureModel.constraints[0];
    svg = more_constraints(svg, constraints);
    // console.log(constraints.rule.length);
  }
  pathf = path.dirname(pathf);
  fs.writeFileSync(pathf + "/featureTree.svg", svg);
  // console.log("✅ Enhanced SVG saved as featureTreeEnhanced.svg");
}

module.exports = {
  visualize
};

// visualize("model.xml").catch(console.error);