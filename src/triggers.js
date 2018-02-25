function onOpen() {
  //TODO: Check for SQUARE_ACCESS_TOKEN in Properties; throw exception / warning if that is not present
  SpreadsheetApp.getUi()
      .createMenu('Station Menu')
      .addItem('Cashier Station', 'showCashierSidebar')
      .addItem('Labeling Station', 'showLabelingSidebar')
      .addItem('Ready Station', 'showReadySidebar')
      .addItem('Closing Station', 'showClosingSidebar')
      .addToUi();

  SpreadsheetApp.getUi()
      .createMenu('Simulate')
      .addItem('Simulate New Order', 'simulateNewOrder')
      .addToUi();
  
  //TODO: validate/install triggers
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

function showCashierSidebar() {
  var html = HtmlService.createTemplateFromFile('src/html/sidebarTemplate');
  html.futureState = "Present";
  var htmlOutput = html.evaluate()
                       .setTitle('Cashier sidebar')
                       .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function showLabelingSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('src/html/labelingSidebar')
                        .setTitle('Labeling sidebar')
                        .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showReadySidebar() {
  var html = HtmlService.createTemplateFromFile('src/html/sidebarTemplate');
  html.futureState = "Ready";
  var htmlOutput = html.evaluate()
                       .setTitle('Ready sidebar')
                       .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function showClosingSidebar() {
  var html = HtmlService.createTemplateFromFile('src/html/sidebarTemplate');
  html.futureState = "Closed";
  var htmlOutput = html.evaluate()
                       .setTitle('Closing sidebar')
                       .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * This trigger will fire when a human edits the spreadsheet contents. It does not fire when a method
 * within these scripts append a row to the spreadsheet.
 */
function onEdit(e) {
  //TOOD: scan for any rows that have Present but nothing in current wait time
  notifySidebars();
}

/**
 * This scans the transaction log, and sends updated subsets of data to the various sidebar views.
 */
function notifySidebars() {
  var worksheet = new Worksheet();
  var allOrders = worksheet.worksheet.all();
  
  var presentOrders = allOrders.filter(function (order) {
    return order["Order State"] === "Present";
  });
  
  var labeledOrders = allOrders.filter(function (order) {
    return order["Order State"] === "Labeled";
  });
  
  var readyOrders = allOrders.filter(function (order) {
    return order["Order State"] === "Ready";
  });
  
}

function printLabel(order_id) {
  var worksheet = new Worksheet();
  worksheet.validateAndAdvanceState(order_id,'Present');
}

function reprintLabel(order_id) {
  var worksheet = new Worksheet();
  // we do not validate nor check state for reprinting here
  //TODO: perhaps we should require minimum >= present?
  worksheet.reprintLabel(order_id);
}

function markPresent(order_id) {
  var worksheet = new Worksheet();
  var rowIndex = worksheet.validateAndAdvanceState(order_id,'Paid Online');
  worksheet.updateWaitTimeFormulas(rowIndex);
}

function markReady(order_id) {
  var worksheet = new Worksheet();
  worksheet.validateAndAdvanceState(order_id,'Labeled');
}

function markClosed(order_id) {
  var worksheet = new Worksheet();
  worksheet.validateAndAdvanceState(order_id,'Ready');
}

function advanceState(order_id) {
  var worksheet = new Worksheet();
  worksheet.advanceState(order_id);
}