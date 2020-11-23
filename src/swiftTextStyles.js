// Imports

var utils = require('./utils.js')
var swiftColors = require('./swiftColors.js')

// Public functions

function getTextStylesSwiftFileContent(context) {
  var code = getSwiftFontImportCode(context) + "\n\n";
  code += getTextStylesSwiftSnippet(context, true) + "\n\n";
  code += getSwiftConvenienceStringExtensions();
  return code
}

function getTextStylesSwiftSnippet(context, forExport) {
  const textStyles = utils.getResources(context, "textStyles");
  var code = "";
  code += getEnumCode(textStyles) + "\n\n";
  code += getFontColorExtension(context, textStyles, forExport) + "\n\n";
  code += getFontsExtension(context, textStyles, forExport) + "\n\n"; 
  code += getKerningExtension(context, textStyles, forExport) + "\n\n";
  code += getLineHeightExtension(context, textStyles, forExport) + "\n\n";
    
  return code
}

function getAttributesCode(context, textStyle, forStyleguide, forExport, indent) {
  var code = "";

  const usesParagraphStyle = shouldUseParagraphStyle(textStyle);
  if (usesParagraphStyle) {
    code += getParagraphStyleCreationCode(textStyle, indent) + "\n";
  }

  if (forStyleguide) {
    code += utils.tab(indent) + "return ";
  } else {
    code += "let attributes = ";
  }

  code += "[.font: " + getFontCode(context, textStyle, forExport);

  indent = indent + 1;

  if (usesParagraphStyle) {
    code += ",\n" + utils.tab(indent) + ".paragraphStyle: paragraphStyle";
  }
  if (typeof textStyle.color !== 'undefined') {
    code += ",\n" + utils.tab(indent) + ".foregroundColor: " + getColorCode(context, textStyle.color, forExport);
  }
  if (typeof textStyle.letterSpacing !== 'undefined' && textStyle.letterSpacing != 0) {
    code += ",\n" + utils.tab(indent) + ".kern: " + textStyle.letterSpacing;
  }

  code += "]";
  return code;
}

module.exports = { getTextStylesSwiftFileContent, getTextStylesSwiftSnippet, getAttributesCode };

// Private functions
var camelCase = require('camel-case')

function getSwiftConvenienceStringExtensions() {
  return "";
}

function getSwiftFontImportCode() {
  var code = "";
  return code;
}

function getFontSwiftType(context, forExport) {
  return "UIFont";
}

function getEnumCode(textStyles) {
  var code = "enum TextStyle {\n";

  for(var textStyle of textStyles) {
    code += utils.tab(1) + "case " + camelCase(textStyle.name) + "(color: UIColor? = nil)\n";
  }

  code +=utils.tab(1) + "var color: UIColor {\n";
  code +=utils.tab(2) + "switch self {\n";
  code +=utils.tab(3) + "case \n";
  for(var textStyle of textStyles) {
    code += utils.tab(4) + "." + camelCase(textStyle.name) + "(color: let color),\n";
  }
  code =  code.slice(0, -2);
  code += ":\n\n";
  code += utils.tab(3)+"if color != nil {\n";
  code += utils.tab(4)+"return color!\n";
  code += utils.tab(3)+"}\n\n";

  code += utils.tab(3)+"if let defaultColor = TextStyle.provider?.defaultColorFor(style: self) {\n";
  code += utils.tab(4)+"return defaultColor";
  code += utils.tab(3)+"}\n\n";
  code += utils.tab(3)+"return .systemPink\n";
  code += utils.tab(2)+"}\n";
  code += utils.tab(1)+"}\n";
  code += utils.tab(0)+"}\n";
  return code;
}

function getAllAttributesCode(context, textStyles, forExport) {
  var code = "var attributes: [NSAttributedString.Key: Any] {\n";

  if (textStyles.length == 0) {
    code += utils.tab(2) + "return [:]\n"
  } else {
    code += utils.tab(2) + "switch self {\n";
    for(var textStyle of textStyles) {
      code += utils.tab(2) + "case ." + camelCase(textStyle.name) + ":\n";
      code += getAttributesCode(context, textStyle, true, forExport, 3) + "\n\n";
    }
    code += utils.tab(2) + "}\n";
  }

  code += utils.tab(1) + "}";
  return code;
}

function getFontsExtension(context, textStyles, forExport) {
  
  const fontType = getFontSwiftType(context, forExport);
  var code = "extension Provider {\n";
  code += utils.tab(1) + "func fontFor(style: TextStyle) -> "+fontType+"? {\n";
  
    
  if (textStyles.length == 0) {
    code += utils.tab(2) + "return nil\n"
  } else {
    code += utils.tab(2) + "switch style {\n";
    for(var textStyle of textStyles) {
      code += utils.tab(3) + "case ." + camelCase(textStyle.name) + ":\n";
    
      const fontFormat = context.getOption("fontFormat");
      if (fontFormat == "system") {
        code += utils.tab(4) +"return "+ `${fontType}(name: "${textStyle.fontFace}", size: ${textStyle.fontSize})`
      } else if (fontFormat == "swiftgen") {
        code += utils.tab(4) +"return "+ `FontFamily.${textStyle.fontFamily}.${textStyle.weightText}.font(size: ${textStyle.fontSize})`;
      }
      code +="\n";
    }
    code += utils.tab(3) + "}\n";
  }
  code += utils.tab(1) + "}\n";
  code += "}";
  return code;
}

function getKerningExtension(context, textStyles, forExport) {
  
  var code = "extension Provider {\n";
  code += utils.tab(1) + "func kerningFor(style: TextStyle) -> CGFloat? {\n";
   
  if (textStyles.length == 0) {
    code += utils.tab(2) + "return nil\n"
  } else {
    code += utils.tab(2) + "switch style {\n";

    var casesWithoutLetterspacing = ""
    for(var textStyle of textStyles) {
      
      if (typeof textStyle.letterSpacing !== 'undefined' && textStyle.letterSpacing != 0) {
        code += utils.tab(3) + "case ." + camelCase(textStyle.name) + ":\n";
        code += utils.tab(4) + "return " + textStyle.letterSpacing;
        code +="\n";
      }else{
        if(casesWithoutLetterspacing == ""){
          casesWithoutLetterspacing = "case ." + camelCase(textStyle.name)
        }else{
          casesWithoutLetterspacing += ", ." + camelCase(textStyle.name)
        }
      }
    }

    if(casesWithoutLetterspacing != ""){
      code += utils.tab(3) + casesWithoutLetterspacing + ":\n"
      code += utils.tab(4) + "return nil\n";
    }

    code += utils.tab(3) + "}\n";
    
  }


  code += utils.tab(1) + "}\n";
  code += "}";
  return code;
}

function getLineHeightExtension(context, textStyles, forExport) {
  
  
  var code = "extension Provider {\n";
  code += utils.tab(1) + "func lineHeightMultipleFor(style: TextStyle) -> CGFloat {\n";
   
  
  if (textStyles.length == 0) {
    code += utils.tab(2) + "return 1\n"
  } else {
    code += utils.tab(2) + "switch style {\n";

    var casesWithoutLetterspacing = ""
    for(var textStyle of textStyles) {
      
      if (typeof textStyle.lineHeight !== 'undefined' && textStyle.lineHeight !== textStyle.fontSize) {
        code += utils.tab(3) + "case ." + camelCase(textStyle.name) + ":\n";
        code += utils.tab(4) + "return " + (textStyle.lineHeight / textStyle.fontSize);
        code +="\n";
      }else{
        if(casesWithoutLetterspacing == ""){
          casesWithoutLetterspacing = "case ." + camelCase(textStyle.name)
        }else{
          casesWithoutLetterspacing += ", ." + camelCase(textStyle.name)
        }
      }
    }

    if(casesWithoutLetterspacing != ""){
      code += utils.tab(3) + casesWithoutLetterspacing + ":\n"
      code += utils.tab(4) + "return 1\n";
    }

    code += utils.tab(3) + "}\n";
    
  }


  code += utils.tab(1) + "}\n";
  code += "}";
  return code;
}

function getFontColorExtension(context, textStyles, forExport) {
  
  var code = "extension Provider {\n";
  code += utils.tab(1) + "func defaultColorFor(style: TextStyle) -> UIColor? {\n";
  
  if (textStyles.length == 0) {
    code += utils.tab(2) + "return nil\n"
  } else {
    code += utils.tab(2) + "switch style {\n";

    var casesWithoutLetterspacing = ""
    for(var textStyle of textStyles) {
      
      if (typeof textStyle.lineHeight !== 'undefined' && textStyle.lineHeight !== textStyle.fontSize) {
        code += utils.tab(3) + "case ." + camelCase(textStyle.name) + ":\n";
        code += utils.tab(4) + "return " + getColorCode(context, textStyle.color, forExport);
        code +="\n";
      }else{
        if(casesWithoutLetterspacing == ""){
          casesWithoutLetterspacing = "case ." + camelCase(textStyle.name)
        }else{
          casesWithoutLetterspacing += ", ." + camelCase(textStyle.name)
        }
      }
    }

    if(casesWithoutLetterspacing != ""){
      code += utils.tab(3) + casesWithoutLetterspacing + ":\n"
      code += utils.tab(4) + "return nil\n";
    }

    code += utils.tab(3) + "}\n";
    
  }


  code += utils.tab(1) + "}\n";
  code += "}";
  return code;
}

function getFontCode(context, textStyle, forExport) {

  const fontType = getFontSwiftType(context, forExport);

  if (textStyle.fontFamily.startsWith("SFPro") ||
      textStyle.fontFamily.startsWith("SFCompact")) {
    const fontWeightCode = "." + textStyle.weightText.toLowerCase();
    return fontType + ".systemFont(ofSize: " + textStyle.fontSize + ", weight: " + fontWeightCode + ")";
  }

  const fontFormat = context.getOption("fontFormat");
  if (fontFormat == "system") {
    return `${fontType}(name: "${textStyle.fontFace}", size: ${textStyle.fontSize}) as Any`
  } else if (fontFormat == "swiftgen") {
    return `FontFamily.${textStyle.fontFamily}.${textStyle.weightText}.font(size: ${textStyle.fontSize})`;
  }
}

function shouldUseParagraphStyle(textStyle) {
  return (typeof textStyle.textAlign !== 'undefined')
  || (typeof textStyle.lineHeight !== 'undefined');
}

function getParagraphStyleCreationCode(textStyle, indent) {
  var code = utils.tab(indent) + "let paragraphStyle = NSMutableParagraphStyle()\n";
  //Handle the textAlign value
  if (typeof textStyle.textAlign !== 'undefined') {
    var swiftValue = textStyle.textAlign;
    if (swiftValue == "justify") {
      swiftValue = "justified";
    }
    code += utils.tab(indent) + "paragraphStyle.alignment = ." + swiftValue + "\n";
  }

  //Handle the lineHeight value
  if (typeof textStyle.lineHeight !== 'undefined') {
    code += utils.tab(indent) + "paragraphStyle.minimumLineHeight = " + textStyle.lineHeight;
  }

  return code;
}

function getColorCode(context, color, forExport) {
  const existingColor = context.project.findColorEqual(color)
  if (typeof existingColor !== 'undefined') {
    return swiftColors.getExistingColorSwiftCode(context, existingColor, forExport)
  } else {
    return swiftColors.getColorSwiftCode(context, color, forExport)
  }
}


