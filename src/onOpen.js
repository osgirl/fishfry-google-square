function onOpen() {
  //TODO: Check for SQUARE_ACCESS_TOKEN in Properties; throw exception / warning if that is not present
  SpreadsheetApp.getUi()
      .createMenu('Station Menu')
      .addItem('Labeling Station', 'showLabelingSidebar')
      .addItem('Ready Station', 'showReadySidebar')
      .addItem('Closing Station', 'showClosingSidebar')
      .addToUi();

  SpreadsheetApp.getUi()
      .createMenu('Simulate')
      .addItem('Simulate New Order', 'simulateNewOrder')
      .addToUi();
}

function simulateNewOrder() {
  var fmt_order = new FormatOrder();
  var worksheet = new Worksheet();
  var simulation = new simulateSquare();
  var new_txn = simulation.NewTransaction();
  var new_order = simulation.NewOrder();
  var last_name = 'simulated_' + simulation.randomString(10);
  var txn = fmt_order.ConvertSquareToSheet(new_txn, new_order, last_name);
  worksheet.upsertTransaction(txn);
}

function showLabelingSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('src/html/labelingSidebar')
                        .setTitle('Labeling sidebar')
                        .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showReadySidebar() {
  var html = HtmlService.createHtmlOutputFromFile('src/html/readySidebar')
                        .setTitle('Ready sidebar')
                        .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showClosingSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('src/html/closingSidebar')
                        .setTitle('Closing sidebar')
                        .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}
