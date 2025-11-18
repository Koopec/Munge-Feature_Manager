import fs from "fs";
import Viz from "viz.js";
import { Module, render } from "viz.js/full.render.js";
import { loadXML, explodeArrayObjects ,buildFeatureTree } from "./parser.js"; // your parser

// Map node properties to DOT style
function nodeStyle(node) {
  let color = node.hidden ? "#ccc" : node.mandatory ? "gold" : "lightblue";
  let shape = node.abstract ? "diamond" : node.type === "alt" ? "ellipse" : "box";
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
    const nodeName = n.name.replace(/[^a-zA-Z0-9]/g, "_");
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

export function constraintToText(expr) {
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

async function main() {
  const featureModelXML = await loadXML("model.xml");
  const featureTree = buildFeatureTree(featureModelXML.featureModel.struct[0]);
  const constraints = featureModelXML.featureModel.constraints[0];
  const text_constraints = constraintToText(constraints.rule[0]);
  console.log(text_constraints);

  const dot = featureTreeToDot(featureTree);
  const viz = new Viz({ Module, render });
  let svg = await viz.renderString(dot);

  // add constraints
  svg = svg.replace('</g>\n</svg>',`<text x="280" y="-200" font-size="6" fill="black">${text_constraints}</text></g>\n</svg>`);
  
  fs.writeFileSync("featureTreeEnhanced.svg", svg);
  console.log("✅ Enhanced SVG saved as featureTreeEnhanced.svg");
}

main().catch(console.error);
