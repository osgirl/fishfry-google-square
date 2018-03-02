function Worksheet(spreadsheet_id, worksheet_name) {
  var spreadsheet_id = ScriptProperties.getProperty("ssId");
  if (spreadsheet_id === null || spreadsheet_id == undefined) {
    spreadsheet_id = '1NbNqn87RH-T9CoScqKejJlSxOo_CW4VMUnDKzgcE8TU';
  }
  worksheet_name = "Current Event Transaction Log";

  // https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openbyidid
  // The code below opens a spreadsheet using its ID and logs the name for it.
  // Note that the spreadsheet is NOT physically opened on the client side.
  // It is opened on the server only (for modification by the script).
  this.spreadsheet = new ManagedSpreadsheet(spreadsheet_id);
  this.worksheet = this.spreadsheet.sheet(worksheet_name);
  this.order_states = [
    'Paid Online',
    'Present',
    'Labeled',
    'Ready',
    'Closed'
  ];
}

/**
 * Searches transaction log to see if an entry exists for a given ID
 *
 * @param {string} column
 *   Column to search in
 * @param {string} value
 *   Value corresponding to the input column
 * @returns {integer} row_index
 *   Returns the row number corresponding to the entry if present, -1 if not present
 */
Worksheet.prototype.searchForTransaction = function(column, value) {
  return this.worksheet.rowIndex(column, value);
}

/**
 * Appends or updates a row in the current transaction sheet for a new inbound transaction
 *
 * @param {object} proposedOrder
 *   proposed Order in Sheet object schema to be committed to transaction log
 */
Worksheet.prototype.upsertTransaction = function (proposedOrder) {
  var rowIndex = this.searchForTransaction('Payment ID', proposedOrder['Payment ID']);
  
  if (rowIndex == -1) {
    // the transaction hasn't been inserted yet; let's just insert it
    this.worksheet.append(proposedOrder);

    //set formula for wait time columns for the row you just inserted
    if (proposedOrder['Order State'] == "Present") {
      // fetch rowIndex again because it should be in spreadsheet now
      rowIndex = this.searchForTransaction('Payment ID', proposedOrder['Payment ID']);
      this.updateWaitTimeFormulas(rowIndex);
    }
  } else {
    // the transaction has already been inserted; we need to update it
    var existingOrder = this.worksheet.getRowAsObject(rowIndex);  
    //we need to determine the relevant delta between new and old
    // what if there is a "reversion in state?"

    //TODO: determine if refund, then delete row from table
  }
}

Worksheet.prototype.updateWaitTimeFormulas = function (rowIndex) {
  if (rowIndex < 0) {
    console.error('updateWaitTimeFormulas: Invalid rowIndex: ' + rowIndex);
    return;
  }
  // find the column letters that represents "current wait time", "order state", "time present"
  var curWaitTimeCell = this.worksheet.getColumnLetter("Current Wait Time") + rowIndex;
  var orderStateCell  = this.worksheet.getColumnLetter("Order State") + rowIndex;
  var timePresentCell = this.worksheet.getColumnLetter("Time Present") + rowIndex;

  this.worksheet.worksheet.getRange(timePresentCell).setNumberFormat("h:mmam/pm");

  var curWaitTimeFormula = "IF(OR("+orderStateCell+"=\"Present\","+
                                    orderStateCell+"=\"Labeled\","+
                                    orderStateCell+"=\"Ready\"),NOW()-"+timePresentCell+",\"\")";

  this.worksheet.worksheet.getRange(curWaitTimeCell).setFormula(curWaitTimeFormula).setNumberFormat("[m] \"minutes\"");

  var finalWaitTimeCell = this.worksheet.getColumnLetter("Final Wait Time") + rowIndex;
  var timeClosedCell    = this.worksheet.getColumnLetter("Time Closed") + rowIndex;

  var finalWaitTimeFormula = "IF("+orderStateCell+"=\"Closed\","+timeClosedCell+"-"+timePresentCell+",\"\")";

  this.worksheet.worksheet.getRange(finalWaitTimeCell).setFormula(finalWaitTimeFormula).setNumberFormat("[m] \"minutes\"");
}

Worksheet.prototype.reprintLabel = function (orderNumber, printerId) {
  this.printLabel(orderNumber, printerId, false);
}

Worksheet.prototype.printLabel = function(orderNumber, printerId, advanceState) {
  if (typeof(advanceState)==='undefined'){
    advanceState = true;
  }

  var rowIndex = this.searchForTransaction('Order Number', parseInt(orderNumber));
  if (rowIndex == -1) {
    var errMsg = "printLabel: Unable to locate Order Number: " + orderNumber;
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return false;
  }

  var order = this.worksheet.getRowAsObject(rowIndex);
  console.log("printLabel: order data from sheet: " + JSON.stringify(order));

  // retrieve filename from row
  if (order['Label Doc Link'] == "") {
    // the label was not generated yet, so attempt now
    var fmtLabel = new FormatLabel();
    order['Label Doc Link'] = fmtLabel.createLabelFileFromSheet(order);
    // we need to update this cell directly as orm.update() will blow away formulas
    this.worksheet.updateCell(rowIndex, 'Label Doc Link', order['Label Doc Link']);
  }

  //TODO: catch and raise exception
  var printer = new Printer(printerId);
  if (printer.PrintFileUrl(order['Label Doc Link']) !== true) {
    var errMsg = 'printLabel: Print was unsuccessful for order: ' + orderNumber;
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return false;
  }

  if (advanceState && (rowIndex != this.validateAndAdvanceState(orderNumber, 'Present')))
    return false;

  return true;
}

Worksheet.prototype.setState = function(orderNumber, newState) {
  var column = 'Order State';
  var rowIndex = this.searchForTransaction('Order Number', parseInt(orderNumber));
  if (rowIndex == -1) {
    var errMsg = "setState: Unable to locate Order Number: " + orderNumber;
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return false;
  }

  // update state
  var orderStateCell = this.worksheet.getColumnLetter(column) + rowIndex;
  this.worksheet.worksheet.getRange(orderStateCell).setValue(newState);

  // update state time
  var timeCell = this.worksheet.getColumnLetter('Time ' + newState);
  if (timeCell !== "") {
    this.worksheet.worksheet.getRange(timeCell+rowIndex).setValue(convertISODate(new Date()));
  }
  return newState;
}

Worksheet.prototype.validateAndAdvanceState = function(orderNumber, fromState) {
  var rowIndex = this.searchForTransaction('Order Number', parseInt(orderNumber));
  if (rowIndex == -1) {
    var errMsg = "validateAndAdvanceState: Unable to locate Order Number: " + orderNumber;
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return -1;
  }
  if (this.order_states.indexOf(fromState) == -1){
    var errMsg = "validateAndAdvanceState: State '"+fromState+"' not found in state machine!";
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return -1;
  }

  var order = this.worksheet.getRowAsObject(rowIndex);

  // locate current state in state machine
  var current_state = order['Order State'];
  var stateIndex = this.order_states.indexOf(current_state);

  if (stateIndex == this.order_states.length - 1) {
    var errMsg = "validateAndAdvanceState: Order " + orderNumber + " is already at the end of the State Machine!";
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return -1;
  }

  // increment state
  var new_state = this.order_states[stateIndex + 1];
  var desired_new_state = this.order_states.indexOf(fromState) + 1;
  if (new_state != this.order_states[desired_new_state]){
    var errMsg = "validateAndAdvanceState: Order " + orderNumber + " cannot transition to " + this.order_states[desired_new_state] + ' from ' + current_state;
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return -1;
  }

  // update state in object
  order['Order State'] = new_state;

  // test to make sure field is in spreadsheet
  if (!order.hasOwnProperty('Time ' + new_state)) {
    var errMsg = 'validateAndAdvanceState: State: ' + new_state + ' is not a column in the spreadsheet .. but probably should be?';
    console.error(errMsg);
    Browser.msgBox(errMsg);
    return -1;
  } else {
    // update state time in object only if it's a valid column
    order['Time ' + new_state] = convertISODate(new Date());
  }
  //commit state change and timestamp to spreadsheet
  this.worksheet.updateCell(rowIndex, 'Order State', order['Order State']);
  this.worksheet.updateCell(rowIndex, 'Time ' + new_state, order['Time ' + new_state]);

  var timeCell = this.worksheet.getColumnLetter("Time " + new_state) + rowIndex;
  this.worksheet.worksheet.getRange(timeCell).setNumberFormat("h:mmam/pm");

  return rowIndex;
}

/**
 * This method extracts the note field for a given online order, and sets the cell in
 * the spreadsheet that will store the note across all meals, so that the message shows
 * up on every label that is printed.
 *
 * The input data to this method should be an array of Objects, that looks like this:
 *
 * [{'Order Placed At': '2018-02-22 14:30:46 EST',
 *   'Receipt Number': 'PXp3',
 *   'Order Description': 'Clam Chowder Soup (Regular)',
 *   'Fulfillment Type': 'ELECTRONIC',
 *   'Order State': 'COMPLETED',
 *   'Pickup At': '',
 *   'Pickup Time Window': '',
 *   'Subtotal': '$3.50',
 *   'Tax': '$0.00',
 *   'Shipping': '$0.00',
 *   'Total': '$3.50',
 *   ...
 *   'Shipping Address': '',
 *   'CC Brand': 'VISA',
 *   'Note': 'test note to merchant' }
 */
Worksheet.prototype.updateNotesForOnlineOrders = function(onlineOrderData) {
  //fetch once for faster iteration
  var allOrders = this.worksheet.all();

  onlineOrderData.forEach( function(onlineOrder) {
    var match = allOrders.filter(function(sheetOrder) {
      //search based on receipt number && total amount to match as data does not
      //provide the entire payment ID, just the first four characters
      //also need to strip the $ character off of the onlineOrder Total value
      return (sheetOrder['Payment ID'].startsWith(onlineOrder['Receipt Number']) &&
              sheetOrder['Total Amount'] == onlineOrder['Total'].substring(1));
    });

    //match should be an array of size 1, but if we don't find it then just return
    if (match.length == 0){
      console.log('updateNotesForOnlineOrders: did not find matches for ' + onlineOrder['Receipt Number']);
      return;
    }
    else if (match.length > 1){
      console.error('updateNotesForOnlineOrders: found multiple matches for ' + onlineOrder['Receipt Number']);
      return;
    }

    var notes = new Array(parseInt(match[0]['Total Meals']));
    //set a note for each meal to be a copy of the online order note.
    notes.map(function() { return onlineOrder['Note']; });

    var rowIndex = this.worksheet.rowIndex('Payment ID',match[0]['Payment ID']);

    this.worksheet.updateCell(rowIndex,'Note on Order',JSON.stringify(notes));
  });
}
