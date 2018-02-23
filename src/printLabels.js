function createLabelFile(orderDetails, customerName, totalMeals, totalSoups) {
  
  //create template of label file
  var labelTemplateFile = DriveApp.getFileById(DocumentApp.openByUrl("https://docs.google.com/document/d/1rLpp1hhFASftN5VvGx2VFz_fKE2WoNqEhF2cJxW5YhI/edit").getId());
  var labelsFolder = DriveApp.getFoldersByName("ff_labels").next();
  
  var editableLabelDocId = labelTemplateFile.makeCopy(labelsFolder).setName(orderDetails.id).getId();
  var editableLabelDoc = DocumentApp.openById(editableLabelDocId);
  //for each meal, enter into label
  
  var mealCount = 1;
  var body = editableLabelDoc.getBody();
  orderDetails.itemizations.forEach( function(item) {
    // if this is a soup, don't print a separate label
    //TODO: what if there are only soups?
    // if totalMeals == 0 && totalSoups > 0
    if (item.name == "Clam Chowder Soup")
      return;
    
    for (var c = 1; c <= item.quantity; c++){
      var labelString = customerName + "\t" + "Meal " + mealCount + " of " + totalMeals + "\n";
    
      if (item.item_variation_name != "")
        labelString += item.name + " (" + item.item_variation_name + ")\n";
      else
        labelString += item.name + "\n"
      
      labelString += "Side: " + item.modifiers[0].name + "\n";
      if (totalSoups > 0)
        labelString += totalSoups + " soups in order";
      
      body.appendParagraph(labelString);
      body.appendPageBreak();
    }      
  });
  // Last Name       Meal X of Y
  // Hand Breaded Fish (ADULT|CHILD)
  // Side: [Fries|Red Potato]
  // Z Soups in Order
  
  // if another meal, new "page"
  
  return editableLabelDoc.getUrl();

}
