function FormatLabel() {

}

/*
 * Create a new document from the template file
 */
FormatLabel.prototype.newLabelTemplate = function(filename) {
  //create template of label file
  var labelTemplateFile = DriveApp.getFileById(DocumentApp.openByUrl("https://docs.google.com/document/d/1rLpp1hhFASftN5VvGx2VFz_fKE2WoNqEhF2cJxW5YhI/edit").getId());
  var labelsFolder = DriveApp.getFoldersByName("ff_labels").next();

  // TODO: verify file doesn't exist before we try to setName?
  var editableLabelDocId = labelTemplateFile.makeCopy(labelsFolder).setName(filename).getId();
  var editableLabelDoc = DocumentApp.openById(editableLabelDocId);
  //TODO: verify file exists before returning?
  return editableLabelDoc;
}

FormatLabel.prototype.formatLabelFromSquare = function(body, orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups) {
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
  // XXXX              XX of XX
  //               XXXXXXXXXXXX
  // XXXXX   XXXXXXXX   XX Soup
  // XXXXXXXXXXXXXXXXXXXXXXXXXX

  // Last Name       Meal X of Y
  // Hand Breaded Fish (ADULT|CHILD)
  // Side: [Fries|Red Potato]
  // Z Soups in Order

  return;
}

FormatLabel.prototype.formatLabelFromSheet = function(body, orderDetails) {
  //TODO: format from data available in Sheet
  return ['test body when not generated from square'];
}

FormatLabel.prototype.createLabelFile = function(orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups) {
  var editableLabelDoc = this.newLabelTemplate("Order " + orderNumber + ": " + customerName);
  //for each meal, enter into label

  var body = editableLabelDoc.getBody();
  this.formatLabelFromSquare(body, orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups);
  var url = editableLabelDoc.getUrl();
  editableLabelDoc.saveAndClose();
  return url;

}
/*
 * Create label from Sheet data
 */
FormatLabel.prototype.createLabelFileFromSheet = function(orderDetails) {
  //As Order Number and Last name should be globally unique, this should make it easy to find in the Drive folder
  var editableLabelDoc = this.newLabelTemplate("Order " + orderDetails['Order Number'] + ": " + orderDetails['Last Name']);
  var body = editableLabelDoc.getBody();
  this.formatLabelFromSheet(body, orderDetails);
  var url = editableLabelDoc.getUrl();
  editableLabelDoc.saveAndClose();
  return url;
}