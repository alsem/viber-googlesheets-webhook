// Copyright 2018 NTC ARGUS.
/// <reference path="google-apps-script-ts/index.d.ts"/>


var TIMESTAMP_COLUMN = 3;
var MESSAGES_SHEET = 'messages';
//удалить всё до текущей даты минус количество дней
function clearMessagesOlderThan(days) {
    var date = new Date();
    date.setDate(date.getDate() - days);
    //var dateOffsetMillis = date.valueOf();
 
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGES_SHEET);
//получаем диапазон временных меток
  var allmessages = sheet.getRange('D:D');
  var lastEarlierDateRow = 2;
  var lastRow = sheet.getLastRow();
  for (var i = 2; i <= lastRow; i++) {
    var timestamp = new Date(allmessages.getCell(i, 1).getValue());      
    
    if (timestamp <= date) {
      //запоминаем номер строки с датой меньше заданной
      lastEarlierDateRow = i;
      Logger.log(date + " < " + timestamp);
    }
  }
  //удаляем все подходящие строки, не включая заголовки столбцов
  sheet.deleteRows(2, lastEarlierDateRow);
  SpreadsheetApp.flush();

}

function clearOldMessages() {
    try {
        clearMessagesOlderThan(2);
    } catch (error) {
        Logger.log(error);
        var errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('errors');
        var cell = errorSheet.getRange('A1').offset(errorSheet.getLastRow(), 0);
        cell.setValue("function sayText: " + error);
    }

}