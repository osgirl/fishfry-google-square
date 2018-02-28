function Printer (printerId) {
  this.printerId = printerId;
  //TODO: validate ID is accessable from script via getPrinterList

  this.service = this.getCloudPrintService();
  this.oauth_token = this.service.getAccessToken();

}

//https://ctrlq.org/code/20061-google-cloud-print-with-apps-script
Printer.prototype.getCloudPrintService = function() {
  return OAuth2.createService('print')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(PropertiesService.getScriptProperties().getProperty("CLIENT_ID"))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty("CLIENT_SECRET"))
    .setCallbackFunction(this.authCallback)
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/cloudprint')
    .setParam('login_hint', Session.getActiveUser().getEmail())
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}

Printer.prototype.showAuthorizationURL = function() {
  var response = this.service.getAuthorizationUrl();
  return response;
}

Printer.prototype.authCallback = function(request) {
  var isAuthorized = this.service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('You can now use Google Cloud Print from Apps Script.');
  } else {
    return HtmlService.createHtmlOutput('Cloud Print Error: Access Denied');
  }
}

Printer.prototype.OauthToken = function() {
  /*
  var cache = CacheService.getDocumentCache();
  if (cache !== null) {
    var token = cache.get("bearer-token");
    if (token !== null) {
      return token;
    }
  }
  var token = this.service.getAccessToken();
  cache.put("bearer-token", token, 60); // cache for 6 hours
  return token;
  */
  // because each instance of a 'Printer' will get a new token, we can likely assume the lifespan of the token will not
  // expire before this instance is destroyed
  return this.service.getAccessToken();
}

Printer.prototype.getPrinterList = function() {
  var response = UrlFetchApp.fetch('https://www.google.com/cloudprint/search', {
    headers: {
      Authorization: 'Bearer ' + this.OauthToken()
    },
    muteHttpExceptions: true
  }).getContentText();

  try {
    var printers = JSON.parse(response).printers;
  } catch (e) {
    Browser.msgBox(e);
    return [];
  }

  for (var p in printers) {
    Logger.log("%s %s %s", printers[p].id, printers[p].name, printers[p].description);
  }
  return printers;
}


Printer.prototype.PrintFileUrl = function(filename_url) {
  // verify filename exists and we have access to it
  var file = null;
  try {
    Logger.log(filename_url);
    file = DocumentApp.openByUrl(filename_url);
  } catch (e) {
    Logger.log(e);
    // TODO: sometimes it's unable to open the URL, but if we pass the ID it will succeed...
    return this.PrintFileId(this.IdFromUrl(filename_url));
  }
  return this.PrintGoogleDocument(file.getId(), file.getName());
}

Printer.prototype.IdFromUrl = function(str) {
  try {
    return str.substr(str.indexOf('id=')+3);
  } catch (e) {
    Logger.log(e);
  }
  return null;
}

Printer.prototype.PrintFileId = function(fileId) {
  var file = null;
  try {
    file = DocumentApp.openById(fileId);
  } catch (e) {
    Logger.log('Unable to locate ID: ' + fileId);
    Browser.msgBox(e);
    return false;
  }
  return this.PrintGoogleDocument(file.getId(), file.getName());l
}

Printer.prototype.PrintGoogleDocument = function(docID, docName) {
  var ticket = {
    version: "1.0",
    print: {
      color: {
        type: "STANDARD_COLOR",
        vendor_id: "Color"
      },
      duplex: {
        type: "NO_DUPLEX"
      }
    }
  };

  // https://stackoverflow.com/questions/30565554/oauth2-with-google-cloud-print
  var payload = {
    "printerid" : this.printerId,
    "title"     : docName,
    "content"   : docID,
    "contentType": "google.kix",
    "ticket"    : JSON.stringify(ticket)
  };

  console.log('Attempting print for: "' + docName + '" to: ' + this.printerId)
  var response = UrlFetchApp.fetch('https://www.google.com/cloudprint/submit', {
    method: "POST",
    payload: payload,
    headers: {
      Authorization: 'Bearer ' + this.OauthToken()
    },
    "muteHttpExceptions": true
  });

  try {
    response = JSON.parse(response);
    if (response.success) {
      Logger.log("%s", response.message);
      return true;
    } else {
      Browser.msgBox("Error Code: %s %s", response.errorCode, response.message);
      return false;
    }
  } catch (e) {
    Logger.log(e);
  }
}
