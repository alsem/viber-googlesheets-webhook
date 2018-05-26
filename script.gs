// Copyright 2018 NTC ARGUS.
/// <reference path="google-apps-script-ts/index.d.ts"/>
// Constants
var PARAMETERS_SHEET_NAME = 'parameters';
var MESSAGES_SHEET_NAME = 'messages';

// Global parameters (Values will be read from the parameters sheet)
var gDidFillParameters = false;
var gAccessToken = 'Your access token value from the parameters sheet';
var gBotName = 'Your bot name from the parameters sheet';
var gBotAvatar = 'Your bot avatar url from the parameters sheet';
var gWelcomeMessage = 'Your welcome message from the parameters sheet';
var gWelcomeStartButton = 'Your welcome start button from the parameters sheet';
var gEndMessage = 'Your end message from the parameters sheet';
var gDoNotUnderstandMessage = 'Your do not understand input message from the parameters sheet';
var gShouldUseRandomColors = false;
var gDefaultKeyboardColor = 'Your default keyboard option color from the parameters sheet';

// ---- Post/Get обработчики скрипта, опубликованного в качестве веб-приложения ----
// noinspection UnusedStatementJS
// noinspection JSUnusedGlobalSymbols
function doPost(e) {
    Logger.log(e);

    if (!e || !e.postData || !e.postData.contents) return;

    try {
        var postData = JSON.parse(e.postData.contents);
        if (!postData) return;
        // Accepting only message/conversation started events
        if (!(isConversationStartEvent(postData)
                || isMessageEvent(postData) && isTextMessage(postData))) {
            return;
        }

        initializeGlobalParametersIfNeeded();

        if (isConversationStartEvent(postData)) {
            sendWelcomeMessage(postData);
        }

        storeMessage(postData);

        //зеркалирование сообщения
        sendTextMessage("Я прочитал: " + extractTextFromMessage(postData), extractSenderId(postData));


    } catch (error) {
        Logger.log(error);
        var errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('errors');
        var cell = errorSheet.getRange('A1').offset(errorSheet.getLastRow(), 0);
        cell.setValue("function sayText: " + error);
    }
}

// noinspection UnusedStatementJS
// noinspection JSUnusedGlobalSymbols
function doGet(e) {
    Logger.log(e);
    var appData = {
        'heading': 'Hello Bot!',
        'body': 'Welcome to the Chat Bot app.'
    };

    var JSONString = JSON.stringify(appData);
    var JSONOutput = ContentService.createTextOutput(JSONString);
    JSONOutput.setMimeType(ContentService.MimeType.JSON);
    return JSONOutput
}

// ---- Валидация входных данных----

function isEvent(postData, event) {
    return (postData.event == event);
}

function isMessageEvent(postData) {
    return isEvent(postData, 'message');
}

function isMessageType(postData, type) {
    if (!isMessageEvent(postData)) return false;
    return postData.message && postData.message.type == type;
}

function isConversationStartEvent(postData) {
    return isEvent(postData, 'conversation_started');
}

function isTextMessage(postData) {
    return isMessageType(postData, 'text');
}

// ----  Бизнес-логика ----

function appendMessage(postData) {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName(MESSAGES_SHEET_NAME); // select the messages sheet
    var event = extractEventType(postData);
    var messageId = extractMessageToken(postData);
    var senderId = extractSenderId(postData);
    var time = extractTimestamp(postData);
    var text = extractTextFromMessage(postData);
    sheet.appendRow([event, messageId, senderId, time, text]);
    SpreadsheetApp.flush();
}

// ---- Send messages methods ----
function sayText(text, userId, authToken, senderName, senderAvatar, trackingData, keyboard) {
    try {
        var data = {
            'type': 'text',
            'text': text,
            'receiver': userId,
            'sender': {
                'name': senderName,
                'avatar': senderAvatar
            },
            'tracking_data': JSON.stringify(trackingData || {})
        };

        if (keyboard) {
            data.keyboard = keyboard;
        }

        var options = {
            'async': true,
            'crossDomain': true,
            'method': 'POST',
            'headers': {
                'X-Viber-Auth-Token': authToken,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            'payload': JSON.stringify(data)
        };

        Logger.log(options);
        var result = UrlFetchApp.fetch('https://chatapi.viber.com/pa/send_message', options);
        Logger.log(result);

    } catch (error) {
        var errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('errors');
        var cell = errorSheet.getRange('A1').offset(errorSheet.getLastRow(), 0);
        cell.setValue("function sayText: " + error);
    }
}

function sendWelcomeMessage(postData) {
    var keyboardObject = createKeyboard([gWelcomeStartButton]);
    sendTextMessage(gWelcomeMessage, extractSenderId(postData), keyboardObject);
}

function sendTextMessage(text, userId, keyboard) {
    sayText(text, userId, gAccessToken, gBotName, gBotAvatar, null, keyboard);
}

function createKeyboard(values) {

    var keyboardGenerator = new KeyboardGenerator();
    for (var i = 0; i < values.length; i++) {
        var keyboardValue = values[i];
        keyboardGenerator.addElement(keyboardValue, (gShouldUseRandomColors ? undefined : gDefaultKeyboardColor));
    }

    return keyboardGenerator.build();
}
//--- Testing mirror message
function sayHello() {
    initializeGlobalParametersIfNeeded();
    try {
        sayText("Привет, это бот", "A4NRSvHxFcTzrF384i69Qw==", gAccessToken, gBotName, gBotAvatar)
    } catch (error) {
        Logger.log(error);
        var errorSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('errors');
        var cell = errorSheet.getRange('A1').offset(errorSheet.getLastRow(), 0);
        cell.setValue("function sayText: " + error);
    }
}

// ---- State handling methods ----

function extractSenderId(postData) {
    if (!postData) return undefined;

    if (postData.sender) { // Might be a message event
        return postData.sender.id;
    }
    else if (postData.user) { // Might be a conversation_started event
        return postData.user.id;
    }

    return undefined;
}

function extractMessageToken(postData) {
    if (!postData) return undefined;

    if (postData.message_token) { // Might be a message event
        return Number(postData.message_token).toString();
    }

    return undefined;
}

function extractTimestamp(postData) {
    if (!postData) return undefined;

    if (postData.timestamp) { // Might be a message event
        return postData.timestamp;
    }

    return undefined;
}

function extractEventType(postData) {
    if (!postData) return undefined;

    if (postData.event) { // Might be a message event
        return postData.event;
    }

    return undefined;
}

function extractTextFromMessage(postData) {
    if (!postData || !postData.message) return undefined;

    return postData.message.text;
}

function storeMessage(postData) {
    appendMessage(postData);
}

// ---- Initialization ----
function initializeGlobalParametersIfNeeded() {
    if (gDidFillParameters) return;
    gDidFillParameters = true;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var parametersSheet = ss.getSheetByName(PARAMETERS_SHEET_NAME);

    // Fetch the range of cells B2:B10
    var parametersDataRange = parametersSheet.getRange(2, 1, 9, 2); // Skip header row; Read parameter rows

    // Fetch cell value for each row in the range.
    var parametersData = parametersDataRange.getValues();
    gAccessToken = parametersData[0][1];
    gBotName = parametersData[1][1];
    gBotAvatar = parametersData[2][1];
    gWelcomeMessage = parametersData[3][1];
    gWelcomeStartButton = parametersData[4][1];
    gEndMessage = parametersData[5][1];
    gDoNotUnderstandMessage = parametersData[6][1];
    gShouldUseRandomColors = parametersData[7][1];
    gDefaultKeyboardColor = parametersData[8][1];
}

function FROM_EPOCH(epoch_in_millis) {
    return new Date(epoch_in_millis);
}

function randomExcuse() {
    var result = UrlFetchApp.fetch('http://programmingexcuses.com');
    var doc = XmlService.parse(result);
    var html = doc.getRootElement();

    var menu = html.getChild('center').getChildText('a');
    var output = XmlService.getRawFormat().format(menu);
    return menu;
}