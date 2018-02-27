/*
 * Create a new document from the template file
 */
function newLabelTemplate(filename) {
  //create template of label file
  var labelTemplateFile = DriveApp.getFileById(DocumentApp.openByUrl("https://docs.google.com/document/d/1rLpp1hhFASftN5VvGx2VFz_fKE2WoNqEhF2cJxW5YhI/edit").getId());
  var labelsFolder = DriveApp.getFoldersByName("ff_labels").next();

  // TODO: verify file doesn't exist before we try to setName?
  var editableLabelDocId = labelTemplateFile.makeCopy(labelsFolder).setName(filename).getId();
  var editableLabelDoc = DocumentApp.openById(editableLabelDocId);
  //TODO: verify file exists before returning?
  return editableLabelDoc;
}

function pad(pad, str, padLeft) {
  if (typeof str === 'undefined')
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}

function formatLabelFromSquare(body, orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups) {
  var mealCount = 1;
  var font = 'Courier New';
  orderDetails.itemizations.forEach( function(item) {
    // 26 characters at 14pt
    var line1 = body
      .appendParagraph(pad('    ', orderNumber.toString(), true)
        + '              '
        + pad('  ', mealCount.toString(), true)
        + " of "
        + pad('  ', totalMeals.toString(), true))
      .setFontFamily(font)
      .setSpacingAfter(0)
      .setBold(true)
      .setFontSize(14)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    // 37 characters at 10pt
    var line2 = body
      .appendParagraph(customerName)
      .setFontFamily(font)
      .setBold(false)
      .setFontSize(10)
      .setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    // 33 characters at 11pt
    var line3 = body
      .appendParagraph(item.item_variation_name
        + "   "
        + pad('    ', item.modifiers[0].name, true)
        + "   "
        + pad('  ', totalSoups.toString(), true)
        + " Soup")
      .setFontFamily(font)
      .setBold(true)
      .setFontSize(11)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    // 37 characters at 10pt
    var line4 = body
      .appendParagraph(txnMetadata.note)
      .setFontFamily(font)
      .setBold(false)
      .setFontSize(10)
      .setAlignment(DocumentApp.HorizontalAlignment.LEFT);

    body.appendPageBreak();
    mealCount++;
  });
  // Last Name       Meal X of Y
  // Hand Breaded Fish (ADULT|CHILD)
  // Side: [Fries|Red Potato]
  // Z Soups in Order

  // remove empty first line
  return body;//.deleteText(0,1);
}

function formatLabelFromSheet(orderDetails) {
  //TODO: format from data available in Sheet
  return ['test body when not generated from squqre'];
}

function createLabelFile(orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups) {
  var editableLabelDoc = newLabelTemplate("Order " + orderNumber + ": " + customerName);
  //for each meal, enter into label

  var body = editableLabelDoc.getBody();
  formatLabelFromSquare(body, orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups);

  return editableLabelDoc.getUrl();

}
/*
 * Create label from Sheet data
 */
function createLabelFileFromSheet(orderDetails) {
  //As Order Number and Last name should be globally unique, this should make it easy to find in the Drive folder
  var editableLabelDoc = newLabelTemplate("Order " + orderDetails['Order Number'] + ": " + orderDetails['Last Name']);
  var body = editableLabelDoc.getBody();
  var text = formatLabelFromSheet(orderDetails);
  for (var line in text) {
    body.appendParagraph(text[line]);
    body.appendPageBreak();
  }
  return editableLabelDoc.getUrl();
}

function printLabelFromFile(filename_url) {
  // verify filename exists and we have access to it
  var file = null;
  var printer = '95bc0f2e-5304-762c-5cca-3508d758c0fe';
  try {
    file = DocumentApp.openByUrl(filename_url)
  } catch (e) {
    Logger.log(e);
    //TODO: why would it ever get to this state, and we should be returning 'false'
    return true;
  }
  var printSuccessful = printGoogleDocument(file.getId(), printer, file.getName());

  //TODO: replace 'true' with perform print
  if (true) {
    printSuccessful = true;
  }

  return printSuccessful;
}

//https://ctrlq.org/code/20061-google-cloud-print-with-apps-script
function getCloudPrintService() {
  //TODO: replace CLIENT_ID/SECRET
  return OAuth2.createService('print')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId('CLIENT_ID')
    .setClientSecret('CLIENT_SECRET')
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
  cache.put("bearer-token", token, 21600); // cache for 6 hours
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
