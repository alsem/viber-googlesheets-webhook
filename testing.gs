function myFunction() {
  var numStr = 5190952777860480000
  var converted =  extractMessageToken(numStr);
  var formatStr = Utilities.formatString("%s", converted);
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("test");
  sheet.appendRow([numStr,converted,formatStr])
  sheet.getRange(sheet.getLastRow(), 1, 1, 1).setNumberFormat('0');
  SpreadsheetApp.flush();
  Logger.log(formatStr);
  Logger.log("%s", converted)
}

function extractMessageToken(source) {

    if (source) { // Might be a message event
        return parseInt(source).toFixed();
    }

    return "0";
}