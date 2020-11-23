//Imports

var utils = require("./utils.js")
var camelCase = require('camel-case')

// Public functions

function getColorsSwiftSnippet(context, forExport) {
  const colors = utils.getResources(context, "colors");

  //Loop on every color
  var structColors = "";
  var extensionColorsCode = "";
  var protocolColorsCode = "";
  var colorName = "";
  for (var color of colors){
    colorName = getColorNameSwiftCode(context, color, forExport);
    structColors += utils.tab(1) + getColorDeclarationSwiftCode(context, color, forExport) + "\n";
    extensionColorsCode += utils.tab(1) + `static var ${colorName}: UIColor { UIColor.currentStyle.${colorName}}`+ "\n";
    protocolColorsCode += utils.tab(1) + `var ${colorName}: UIColor { get }`+ "\n";
  }

  //Wrap colors code in an extension
  var code = "";
  code += "\nextension " + getColorSwiftType(context, forExport) + " {\n";
  code += utils.tab(1) + "public static var currentStyle: IColorStyle = DefaultStyle()\n\n";
  code += extensionColorsCode;
  code += "}\n";

  code += "\n\n";
  code += "public protocol IColorStyle {\n";
  code += protocolColorsCode;
  code += "}\n";

  code += "\n\n";
  code += utils.tab(0) + "public struct DefaultStyle: IColorStyle {\n";
  code += structColors;
  code += utils.tab(0) + "}";
  return code;
}





function getColorsSwiftFileContent(context) {
  //Add import to the snippet
  var code = getSwiftColorImport();
  code += getColorsSwiftSnippet(context, true);

  const colorFormat = context.getOption("colorFormat");
  if (colorFormat == "rgb") {
    return code;
  }

  //Add the color hex init
  const alphaFirst = context.getOption("colorFormat") == "hex_argb"
  code += "\n\n" + getSwiftHexColorExtension(context, alphaFirst);

  return code
}

function getExistingColorSwiftCode(context, color, forExport) {
  const colorSwiftType = getColorSwiftType(context, forExport)
  return `${colorSwiftType}.${camelCase(color.name)}`;
}

function getColorSwiftCode(context, color, forExport) {
  const formatOption = context.getOption("colorFormat");
  const colorSwiftType = getColorSwiftType(context, forExport)
  if (formatOption == "rgb") {
    return `${colorSwiftType}(red: ${color.r}/255.0, green: ${color.g}/255.0, blue: ${color.b}/255.0, alpha: ${color.a})`;
  }

  const hexColor = color.toHex();
  if (formatOption == "hex_rgba") {
    const parameterName = getSwiftHexInitParameterName(false);
    return `${colorSwiftType}(${parameterName}:0x${hexColor.r}${hexColor.g}${hexColor.b}${hexColor.a})`;
  } else if (formatOption == "hex_argb") {
    const parameterName = getSwiftHexInitParameterName(true);
    return `${colorSwiftType}(${parameterName}:0x${hexColor.a}${hexColor.r}${hexColor.g}${hexColor.b})`;
  }
}

function getColorStructName(context) {
  var structName = context.getOption("colorStructName");
  if (structName == "") {
    structName = utils.capitalize(camelCase(context.project.name));
  }
  return structName;
}

function getSwiftColorImport() {
  return `import UIKit.UIColor`;
}

module.exports = { getColorsSwiftSnippet,
  getColorsSwiftFileContent,
  getColorSwiftCode,
  getExistingColorSwiftCode,
  getColorStructName,
  getSwiftColorImport
};

// Private functions

function getColorSwiftType(context, forExport) {
  return "UIColor";
}

function getColorNameSwiftCode(context, color, forExport) {
  return `${camelCase(color.name)}`
}
function getColorDeclarationSwiftCode(context, color, forExport) {
  return `let ${getColorNameSwiftCode(context, color, forExport)} = ${getColorSwiftCode(context, color, forExport)}`;
}

function getSwiftHexInitParameterName(alphaFirst) {
  return alphaFirst ? "argbValue" : "rgbaValue";
}

function getSwiftHexColorExtension(context, alphaFirst) {
  const parameterName = getSwiftHexInitParameterName(alphaFirst);
  const redShifintgValue = alphaFirst ? 16 : 24;
  const greenShiftingValue = alphaFirst ? 8 : 16;
  const blueShiftingValue = alphaFirst ? 0 : 8;
  const alphaShiftingValue = alphaFirst ? 24 : 0;

  return `
extension ${getColorSwiftType(context, true)} {
  convenience init(${parameterName}: UInt32) {
    let red   = CGFloat((${parameterName} >> ${redShifintgValue}) & 0xff) / 255.0
    let green = CGFloat((${parameterName} >> ${greenShiftingValue}) & 0xff) / 255.0
    let blue  = CGFloat((${parameterName} >> ${blueShiftingValue}) & 0xff) / 255.0
    let alpha = CGFloat((${parameterName} >> ${alphaShiftingValue}) & 0xff) / 255.0

    self.init(red: red, green: green, blue: blue, alpha: alpha)
  }
}`
}
