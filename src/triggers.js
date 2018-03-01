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
    .addItem('Disable Pull Payments', 'pullPaymentsOff')
    .addItem('Register Webhook', 'registerWebhook')
    .addItem('Delete Webhook', 'deleteWebhooks')
    .addItem('Simulate New Order', 'simulateNewOrder')
    .addToUi();

  SpreadsheetApp.getUi()
    .createMenu('CloudPrint')
    .addItem('Authorization URL', 'testPrinterAccess')
    .addItem('Show Printers', 'showPrinters')
    .addToUi();

  //TODO: validate/install triggers
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
  var api = new squareAPI();
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


function testPrinterAccess() {
  var printer = new Printer();
  Browser.msgBox(printer.showAuthorizationURL());
}

function showPrinters(returnList) {
  var printer = new Printer();
  var printers = printer.getPrinterList();
  if (returnList === undefined) {
    var str_printers = '';
    for (var p in printers) {
      str_printers += printers[p].id + ' ' + printers[p].name + ' ' + printers[p].description + '\\n';
    }
    Browser.msgBox(str_printers);
  } else if (returnList === true) {
    return printers;
  }
}

function printLabel(order_id, printer_id) {
  var worksheet = new Worksheet();
  // the following call will print label & advance state
  if (worksheet.printLabel(order_id, printer_id)) {
    Browser.msgBox("Print successful for: " + order_id);
  }
}

function reprintLabel(order_id, printer_id) {
  var worksheet = new Worksheet();
  // we do not validate nor check state for reprinting here
  //TODO: perhaps we should require minimum >= present?
  worksheet.reprintLabel(order_id, printer_id);
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
