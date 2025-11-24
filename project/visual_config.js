const fs = require("fs");
const { loadXML, validate } = require("./parser.js");

async function config_to_svg(configXML){

  const config = configXML.configuration.feature;

  // SVG layout settings
  const boxWidth = 200;
  const boxHeight = 35;
  const spacing = 10;
  
  let Y;

  let svgContent = "";
  config.forEach((f, i) => {
    const name = f.$.name;
    const manual = f.$.manual;

    const color = manual === "selected" ? "#8fcd88" : "#e89a9a";
    const y = 20 + i * (boxHeight + spacing);
    Y = y;
    svgContent += `
      <rect x="20" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="6"
        fill="${color}" stroke="#555"/>
      <text x="30" y="${y + 23}" font-family="sans-serif" font-size="14">
        ${name} (${manual})
      </text>
    `;
  });

  const validated = await validate();
  // console.log(validated);
  // Wrap in <svg> element
  let color = "green";
  if (validated == "CONFIGURATION IS INVALID"){
    color = "red";
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="${config.length * 75}">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
    ${svgContent}
      <text x="30" 
      y="${Y + 60}" 
      font-family="sans-serif" 
      font-size="14"
      fill="${color}"
      font-weight="bold">
        ${validated}
      </text>
  </svg>
  `;
  // console.log(svg);

  return svg;

}

async function main() {

  const configXML = await loadXML("config.xml");
  const svg =  await config_to_svg(configXML);
  fs.writeFileSync("config.svg", svg);
  // console.log(svg);
}


main().catch(console.error);
