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
    .createMenu('SquareUp')
    .addItem('Enable Pull Payments', 'pullPaymentsOn')
    .addItem('Delete Pull Payments', 'pullPaymentsOff')
    .addItem('Register Webhook', 'registerWebhook')
    .addItem('Delete Webhook', 'deleteWebhooks')
    .addItem('Simulate New Order', 'simulateNewOrder')
    .addToUi();

  //TODO: validate/install triggers
}

/**
 * This trigger will fire when a human edits the spreadsheet contents. It does not fire when a method
 * within these scripts append a row to the spreadsheet.
 */
function onEdit(e) {
  //TOOD: scan for any rows that have Present but nothing in current wait time
  notifySidebars();
}

function pullPaymentsOff() {
  // Delete existing triggers
  // TODO: this blindly deletes ALL triggers
  var triggers = ScriptApp.getProjectTriggers();
  for(var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  Browser.msgBox("Script successfully deleted all scheduled triggers.");
}

function pullPaymentsOn() {
  pullPaymentsOff();

  // Create new trigger to run hourly.
  ScriptApp.newTrigger("pullSquarePayments")
    .timeBased()
    .everyMinutes(2)
    .create();

  Browser.msgBox("Script successfully scheduled to run every minute.");
}

function pullSquarePayments() {
  var worksheet = new Worksheet();
  var fmt = new FormatOrder();
  var payments = api.pullPaymentsSince(new Date().toISOString());
  for (var i in payments) {
    //TODO: we don't have access to the location_id... will this still work if we use 'me'?
    var order = fmt.SquareTransactionToSheet('me', payments[i].id);
    upsertTransaction(order);
  }
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

  Browser.msgBox("Script successfully simulated an Order.");
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
  if (worksheet.printLabel(order_id) === 'Labeled') {
    Browser.msgBox("Print successful.");
  }
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
  var state = worksheet.advanceState(order_id);

  Browser.msgBox(order_id + " transitioned to " + state);
}