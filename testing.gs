function myFunction() {
  var numStr = "5190952777860480000"
  var converted =  extractMessageToken(numStr);
  var formatStr = Utilities.formatString("%s", converted);
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet.getSheetByName("test");
  
  sheet.appendRow([numStr,converted,formatStr])
  
  sheet.getRange(sheet.getLastRow(), 2, 1, 1).setNumberFormat('0');
  SpreadsheetApp.flush();
  
  Logger.log(formatStr);
  Logger.log("%s", converted)
}

function parseMessageToken(source) {

    if (source) { // Might be a message event
        return parseInt(source).toFixed();
    }

    return "0";
}