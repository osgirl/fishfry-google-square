function constructSquareURL(baseURL){
  //TODO: replace with square webhook url
  if (baseURL.indexOf("?") == -1) {
    return "https://trello.com/1/"+ baseURL +"?key="+ScriptProperties.getProperty("appKey")+"&token="+ScriptProperties.getProperty("token");
  } else {
    return "https://trello.com/1/"+ baseURL +"&key="+ScriptProperties.getProperty("appKey")+"&token="+ScriptProperties.getProperty("token");
  }
}

function getWebhooksForToken() {
  //TODO: replace with square webhook url
  var url = "https://trello.com/1/token/" + ScriptProperties.getProperty("token") + "/webhooks?key="+ScriptProperties.getProperty("appKey");
  var resp = UrlFetchApp.fetch(url, {"method": "get"});
  return webhooks = Utilities.jsonParse(resp.getContentText());
}

function registerWebhook() {
  var url = ScriptApp.getService().getUrl();
  if (url == null || url == "") {
    Browser.msgBox("Please follow instructions on how to publish the script as a web-app: http://www.littlebluemonkey.com");
    return;
  }

  //TODO: replace with square webhook url
  var error = checkControlValues(false,true);
  var squareUrl = constructSquareURL("webhooks/?callbackURL=" + encodeURIComponent(url) + "&idModel="+ScriptProperties.getProperty("boardId").trim());
  var resp = UrlFetchApp.fetch(squareUrl, {"method": "post","muteHttpExceptions":true});

  if (resp.getResponseCode() == 200) {
    Browser.msgBox("Webhook successfully registered! PLEASE make sure you change the authorities on the script (See documentation) to allow the webhook callback to work.");
  } else if(resp.getContentText().indexOf("did not return 200 status code, got 403") > 0) {
    Browser.msgBox("Webhook registration failed - HTTP:" + resp.getResponseCode() + ":"
    + " It looks like you need to republish your script with the correct authorities. Please refer to the section in the spreadsheet about generation webhooks. Response from Square was: "
    + resp.getContentText());
  } else {
    Browser.msgBox("Webhook registration failed - HTTP:" + resp.getResponseCode() + ":" + resp.getContentText());
  }
}

function deleteWebhooks() {
  //TODO: replace with square webhook url
  var webhooks = getWebhooksForToken();
  var deleteCount = 0;

  for (var i =0; i < webhooks.length;i++) {
    var url = "https://trello.com/1/token/" + ScriptProperties.getProperty("token") + "/webhooks/" + webhooks[i].id + "?key="+ScriptProperties.getProperty("appKey");
    var resp = UrlFetchApp.fetch(url, {"method": "delete"});
    if (resp.getResponseCode() == 200) {
      deleteCount += 1;
    }

  }

  if (webhooks.length == 0) {
    Browser.msgBox("No webhooks found registered against token " + ScriptProperties.getProperty("token"));
  }
  else {
    Browser.msgBox( webhooks.length + " webhook(s) found for token " + ScriptProperties.getProperty("token") + " and " + deleteCount + " successfully deleted.");
  }
}