// Copyright 2018 NTC ARGUS.
/// <reference path="google-apps-script-ts/index.d.ts"/>


var TIMESTAMP_COLUMN = 3;
var MESSAGES_SHEET = 'messages';
function clearMessagesOlderThan(days) {
    var date = new Date();
    date.setDate(date.getDate() - days);
    var dateOffsetMillis = date.valueOf();

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGES_SHEET);

    var allmessages = sheet.getRange('A:F').offset(sheet.getLastRow(), 0);

    for (var i = 2; i <= allmessages.getNumRows(); i++) {
            var timeCol = allmessages.getCell(i, TIMESTAMP_COLUMN);
            if (dateOffsetMillis >= timeCol) {
                sheet.deleteRows(2, i-2);
                break;
            }
    }

}

function clearOldMessages() {
    try {
        clearMessagesOlderThan(1);
    } catch (error) {
        Logger.log(error);
        var errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('errors');
        var cell = errorSheet.getRange('A1').offset(errorSheet.getLastRow(), 0);
        cell.setValue("function sayText: " + error);
    }

}