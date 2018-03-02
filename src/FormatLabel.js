function FormatLabel() {

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


/*
 * *** Cloud Print Setup Notes ***
 * The following formatting is based on the Dymo Labelwriter 450 and 450 Turbo label printers using the 30336 (1" x 2-1/8") labels  
 * using Goolge Cloud Print.  Note that on the printer side, the print connector was set up using: https://github.com/google/cloud-print-connector
 * and then configuring the default label/paper size (in BOTH places) using the instructions:
 * https://help.shipstation.com/hc/en-us/articles/216103878-How-do-I-adjust-my-DYMO-LabelWriter-4XL-paper-size-Windows-
 * This allowed printing WITHOUT any particular cloud print CDD.
 * For Google Cloud Print to work from the school:
 *  - Open ports 80 and 443 outbound to allow HTTP and HTTPS traffic (nothing required, typically)
 *  - Open port 5222 outbound to allow XMPP message traffic
 * Cloud print printer status:  https://www.google.com/cloudprint/#printers  (will show offline and the Cloud print service will stay Starting with errors if firewall issue)
 * Printer Oauth setup notes:  
 * - https://ctrlq.org/code/20061-google-cloud-print-with-apps-script
 * - If necessary, register the tasks api: https://developers.google.com/google-apps/tasks/firstapp#register
 * - Register oauth2 in the script: https://github.com/googlesamples/apps-script-oauth2
 * - run that showURL() function, on the console (command-Enter) it would give a URL
 * - entered URL in the browser it would fails saying that URL xyz wasn't allowed. 
 * - then go into the API credentials page https://console.developers.google.com/apis/credentials and for that project & creat a web client credential where the 
 *   Authorized Redirect URI matches the one that was mentioned in the earlier message. Then it let me select the google account and complete the authorization.
 *
 * Notes:
 * - Arial was chosed after poor print quality with Courier/Courier New
 *
 * *** Printer Template Notes ***
 * - Must be created in Word to be the correct size, then opened in GDocs to convert it to a Doc.
 * - Nothing fancy, other than that the very first line in the template is just a blank line with 1-point (or very small) font.  There's no way to create/convert a  Word doc
 *   without something; and to be able to just appendParagraph straight away we have a template with the smallest possible line.  
 */

FormatLabel.prototype.formatLabelFromSquare = function(body, orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups) {
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
      if (totalSoups > 0) {
        //TODO: take this out... 
        soupsString = pad('  ', totalSoups.toString(), true) + " Soups";
      }
      var line4 = body
        .appendParagraph(menu.items[sideItemName].abbr + soupsString)
        .setFontFamily(font)
        .setBold(true)
        .setFontSize(11)
        .setAlignment(DocumentApp.HorizontalAlignment.LEFT);

      // 37 characters at 10pt
      var line5 = body
        .appendParagraph(txnMetadata.note)
        .setFontFamily(font)
        .setBold(false)
        .setFontSize(10)
        .setAlignment(DocumentApp.HorizontalAlignment.LEFT);

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

FormatLabel.prototype.createLabelFile = function(orderNumber, orderDetails, txnMetadata, customerName, totalMeals, totalSoups) {
  var editableLabelDoc = this.newLabelTemplate("Order " + orderNumber + ": " + customerName);
  //for each meal, enter into label

  var body = editableLabelDoc.getBody().setText('');
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
