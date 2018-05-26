// Copyright 2018 NTC ARGUS.

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
function doPost(e) {
	Logger.log(e);

	if (!e || !e.postData || !e.postData.contents) return;

	try {
		var postData = JSON.parse(e.postData.contents);

		// Accepting only message/conversation started events
		if (!postData || (!isConversationStartEvent(postData) && !isMessageEvent(postData))) return;

		initializeGlobalParametersIfNeeded();
		if (!isTextMessage(postData)) {
			sendDoNotUnderstandInputMessage(postData);
		} else {
			recordAnswer(postData);
		}
		sayText(extractTextFromMessage(postData), gAccessToken, gBotName, gBotAvatar);
	

	} catch (error) {
		Logger.log(error);
	}
}

function doGet(e) {
	var appData = {
		'heading' : 'Hello Bot!',
		'body' : 'Welcome to the Chat Bot app.'
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
	if (!postData.message || postData.message.type !== type) return false;

	return true;
}

function isConversationStartEvent(postData) {
	return isEvent(postData, 'conversation_started');
}

function isTextMessage(postData) {
	return isMessageType(postData, 'text');
}
function isEmptyState(postData) {
	if (!postData.message) return true;
	return (JSON.stringify(postData.message.tracking_data) === JSON.stringify({}));
}

// ----  Бизнес-логика ----

function appendMessage(postData) {
	var doc = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = doc.getSheetByName(MESSAGES_SHEET_NAME); // select the messages sheet
    var messageId = extractMessageToken(postData);
	var senderId = extractSenderId(postData);
	var time = extractTimestamp(postData);
	var text = extractTextFromMessage(postData);
	sheet.appendRow([messageId, senderId, time, text]);
	SpreadsheetApp.flush();
}

// ---- Send messages methods ----
function sayText(text, userId, authToken, senderName, senderAvatar, trackingData, keyboard) {

	var data = {
		'type' : 'text',
		'text' : text,
		'receiver' : userId,
		'sender' : {
			'name' : senderName,
			'avatar' : senderAvatar
		},
		'tracking_data' : JSON.stringify(trackingData || {})
	};

	if (keyboard) {
		data.keyboard = keyboard;
	}

	var options = {
		'async' : true,
		'crossDomain' : true,
		'method' : 'POST',
		'headers' : {
			'X-Viber-Auth-Token' : authToken,
			'content-type' : 'application/json',
			'cache-control' : 'no-cache'
		},
		'payload' : JSON.stringify(data)
	}

	Logger.log(options);
	var result = UrlFetchApp.fetch('https://chatapi.viber.com/pa/send_message', options);
	Logger.log(result);
}

// ---- State handling methdos ----

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
		return ""+postData.message_token;
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

function extractTextFromMessage(postData) {
	if (!postData || !postData.message) return undefined;

	return postData.message.text;
}

function recordAnswer(postData) {
	appendMessage(postData);
}

function sendWelcomeMessage(postData) {
	sayText(gWelcomeMessage, extractTextFromMessage(postData), gAccessToken, gBotName, gBotAvatar, stateSurveyStarted());
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
	var parametersData = parametersDataRange.getValues()
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
