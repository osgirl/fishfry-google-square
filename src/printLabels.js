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
  var editableLabelDoc = newLabelTemplate(orderDetails.id);
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
  try {
    file = DriveApp.getFileById(DocumentApp.openByUrl(filename_url).getId());
  } catch (e) {
    Logger.log(e);
    //TODO: why would it ever get to this state, and we should be returning 'false'
    return true;
  }
  var printSuccessful = false;

  //TODO: replace 'true' with perform print
  if (true) {
    printSuccessful = true;
  }

  return printSuccessful;
}