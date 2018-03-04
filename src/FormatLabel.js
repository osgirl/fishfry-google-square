function FormatLabel() {
  this.api = new squareAPI();
}

/*
 * Create a new document from the template file
 */
FormatLabel.prototype.newLabelTemplate = function(filename) {
  //create template of label file
  var template_url = "https://docs.google.com/document/d/1rLpp1hhFASftN5VvGx2VFz_fKE2WoNqEhF2cJxW5YhI/edit";
  template_url = 'https://docs.google.com/document/d/1Oc7jDq-KnyYZ2YND9MUBzNtdokU85CQJeq-CSknexWY/edit'; // from Markus
  var labelTemplateFile = DriveApp.getFileById(DocumentApp.openByUrl(template_url).getId());
  var labelsFolder = DriveApp.getFoldersByName("ff_labels").next();

  // TODO: verify file doesn't exist before we try to setName?
  var editableLabelDocId = labelTemplateFile.makeCopy(labelsFolder).setName(filename).getId();
  var editableLabelDoc = DocumentApp.openById(editableLabelDocId);
  //TODO: verify file exists before returning?
  return editableLabelDoc;
}

FormatLabel.prototype.formatLabelFromSquare = function(body, orderNumber, orderDetails, customerName, notes, totalMeals, totalSoups) {
  var menu = new menuItems();
  var mealCount = 1;
  var font = 'Arial';
  orderDetails.itemizations.forEach( function(item) {
    for (var count = 0; count < parseInt(item.quantity); count++) {
      //need to skip soups
      if (item.name == "Clam Chowder Soup")
        return;

      // 26 characters at 14pt
      var line1 = body
        .appendParagraph(pad('    ', orderNumber.toString(), true)
          + '                     '
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
        .setFontSize(11)
        .setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      // 33 characters at 11pt

      var variationString = "";
      if (item.item_variation_name !== "Regular") {
        //if this is adult/child then print; otherwise skip
        variationString = " (" + item.item_variation_name + ")  ";
      }

      var line3 = body
        .appendParagraph(menu.items[item.name].abbr + variationString)
        .setFontFamily(font)
        .setBold(true)
        .setFontSize(11)
        .setAlignment(DocumentApp.HorizontalAlignment.LEFT);

      // 33 characters at 11pt
      var sideItemName = item.modifiers[0].name;
      if (sideItemName == "Mac & Cheese")
        sideItemName += " (Side)";
      
      var soupsString = "";
      console.log("formatLabelFromSquare: totalSoups = " + totalSoups.toString());
      if (parseInt(totalSoups) > 0) {
        soupsString = "\t" + totalSoups.toString() + " Soup" + ((parseInt(totalSoups) > 1) ? "s" : "");
      }
      console.log("formatLabelFromSquare: soupsString = " + soupsString);
      var line4 = body
        .appendParagraph(menu.items[sideItemName].abbr + soupsString)
        .setFontFamily(font)
        .setBold(true)
        .setFontSize(11)
        .setAlignment(DocumentApp.HorizontalAlignment.LEFT);

      // 37 characters at 10pt
      var line5 = body
        .appendParagraph(notes[mealCount - 1])
        .setFontFamily(font)
        .setBold(false)
        .setFontSize(10)
        .setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      mealCount++;
      if (mealCount < totalMeals) {
          body.appendPageBreak();
      }
    }
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

FormatLabel.prototype.createLabelFile = function(orderNumber, orderDetails, customerName, notes, totalMeals, totalSoups) {
  var editableLabelDoc = this.newLabelTemplate("Order " + orderNumber + ": " + customerName);
  //for each meal, enter into label

  var body = editableLabelDoc.getBody().setText('');
  this.formatLabelFromSquare(body, orderNumber, orderDetails, customerName, notes, totalMeals, totalSoups);
  var url = editableLabelDoc.getUrl();
  editableLabelDoc.saveAndClose();
  return url;

}
/*
 * Create label from Sheet data
 */
FormatLabel.prototype.createLabelFileFromSheet = function(orderSheetData, location_id) {
  if (location_id === undefined || isEmpty(locationId))
     location_id  = this.api.default_location_id;
  //As Order Number and Last name should be globally unique, this should make it easy to find in the Drive folder
  var editableLabelDoc = this.newLabelTemplate("Order " + orderSheetData['Order Number'] + ": " + orderSheetData['Last Name']);
  var body = editableLabelDoc.getBody().setText('');
  var squareOrderDetails = this.api.OrderDetails(location_id, orderSheetData['Payment ID']);
  this.formatLabelFromSquare(body, orderSheetData['Order Number'], squareOrderDetails, orderSheetData['Last Name'], JSON.parse(orderSheetData['Note on Order']), parseInt(orderSheetData['Total Meals']), parseInt(orderSheetData['Total Soups']));
  var url = editableLabelDoc.getUrl();
  editableLabelDoc.saveAndClose();
  return url;
}
