function showAuthorizationURL() {
  var cpService = getCloudPrintService();
  var response = cpService.getAuthorizationUrl();
  return response;
}

function clearPrinterOAuthCache() {
 var cache = CacheService.getDocumentCache();
 cache.remove("bearer-token")
}

function printLabelFromFile(filename_url, printerId) {
  // verify filename exists and we have access to it
  var file = null;
  try {
    file = DocumentApp.openByUrl(filename_url)
  } catch (e) {
    Logger.log(e);
    //TODO: why would it ever get to this state, and we should be returning 'false'
    return true;
  }
  var printSuccessful = printGoogleDocument(file.getId(), printerId, file.getName());

  return printSuccessful;
}

//https://ctrlq.org/code/20061-google-cloud-print-with-apps-script
function getCloudPrintService() {
  return OAuth2.createService('print')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(ScriptProperties.getProperty("CLIENT_ID"))
    .setClientSecret(ScriptProperties.getProperty("CLIENT_SECRET"))
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/cloudprint')
    .setParam('login_hint', Session.getActiveUser().getEmail())
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}

function getOAuthToken() {
  var cache = CacheService.getDocumentCache();
  if (cache !== null) {
    var token = cache.get("bearer-token");
    if (token !== null) {
      return token;
    }

  }
  var token = getCloudPrintService().getAccessToken();
  cache.put("bearer-token", token, 60); // cache for 6 hours
  return token;
}

function authCallback(request) {
  var isAuthorized = getCloudPrintService().handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('You can now use Google Cloud Print from Apps Script.');
  } else {
    return HtmlService.createHtmlOutput('Cloud Print Error: Access Denied');
  }
}

function getPrinterList() {
  var response = UrlFetchApp.fetch('https://www.google.com/cloudprint/search', {
    headers: {
      Authorization: 'Bearer ' + getOAuthToken()
    },
    muteHttpExceptions: true
  }).getContentText();

  var printers = JSON.parse(response).printers;

  for (var p in printers) {
    Logger.log("%s %s %s", printers[p].id, printers[p].name, printers[p].description);
  }
  return printers;
}

function printGoogleDocument(docID, printerID, docName) {
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
    "printerid" : printerID,
    "title"     : docName,
    "content"   : docID,
    "contentType": "google.kix",
    "ticket"    : JSON.stringify(ticket)
  };

  var response = UrlFetchApp.fetch('https://www.google.com/cloudprint/submit', {
    method: "POST",
    payload: payload,
    headers: {
      Authorization: 'Bearer ' + getOAuthToken()
    },
    "muteHttpExceptions": true
  });

  response = JSON.parse(response);

  if (response.success) {
    Logger.log("%s", response.message);
    return true;
  } else {
    Logger.log("Error Code: %s %s", response.errorCode, response.message);
    return false;
  }
}
