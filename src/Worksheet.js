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
    Logger.log('Invalid rowIndex: ' + rowIndex);
    return;
  }
  // find the column letters that represents "current wait time", "order state", "time present"
  var curWaitTimeCell = this.worksheet.getColumnLetter("Current Wait Time") + rowIndex;
  var orderStateCell  = this.worksheet.getColumnLetter("Order State") + rowIndex;
  var timePresentCell = this.worksheet.getColumnLetter("Time Present") + rowIndex;

  var curWaitTimeFormula = "IF(OR("+orderStateCell+"=\"Present\","+
                                    orderStateCell+"=\"Labeled\","+
                                    orderStateCell+"=\"Ready\"),NOW()-"+timePresentCell+",\"\")";

  this.worksheet.worksheet.getRange(curWaitTimeCell).setFormula(curWaitTimeFormula).setNumberFormat("hh:mmam");

  var finalWaitTimeCell = this.worksheet.getColumnLetter("Final Wait Time") + rowIndex;
  var timeClosedCell    = this.worksheet.getColumnLetter("Time Closed") + rowIndex;

  var finalWaitTimeFormula = "IF("+orderStateCell+"=\"Closed\","+timeClosedCell+"-"+timePresentCell+",\"\")";

  this.worksheet.worksheet.getRange(finalWaitTimeCell).setFormula(finalWaitTimeFormula).setNumberFormat("hh:mmam");
}

Worksheet.prototype.reprintLabel = function (orderNumber) {
  this.printLabel(orderNumber, false);
}

Worksheet.prototype.printLabel = function(orderNumber, advanceState) {
  if (typeof(advanceState)==='undefined'){
    advanceState = true;
  }

  var rowIndex = this.searchForTransaction('Order Number', parseInt(orderNumber));
  if (rowIndex == -1) {
    Browser.msgBox("Unable to locate Order Number: " + orderNumber);
    return false;
  }

  var order = this.worksheet.getRowAsObject(rowIndex);
  // retrieve filename from row
  if (order['Label Doc Link'] == "") {
    // the label was not generated yet, so attempt now
    order['Label Doc Link'] = createLabelFileFromSheet(order);
    this.worksheet.update(rowIndex, order)
  }

  //TODO: catch and raise exception
  if (printLabelFromFile(order['Label Doc Link']) !== true) {
    Browser.msgBox('Print was unsuccessful for order: ' + orderNumber);
    return false;
  }
  if (advanceState) {
    return this.setState(orderNumber, 'Labeled');
  }
}

Worksheet.prototype.setState = function(orderNumber, newState) {
  var column = 'Order State';
  var rowIndex = this.searchForTransaction('Order Number', parseInt(orderNumber));
  if (rowIndex == -1) {
    Browser.msgBox("Unable to locate Order Number: " + orderNumber);
    return false;
  }

  // update state
  var orderStateCell  = this.worksheet.getColumnLetter(column) + rowIndex;
  this.worksheet.worksheet.getRange(orderStateCell).setValue(newState);

  // update state time
  var timeCell = this.worksheet.getColumnLetter('Time ' + newState);
  if (timeCell !== "") {
    this.worksheet.worksheet.getRange(timeCell+rowIndex).setValue(convertISODate(new Date()));
    //Logger.log('State: ' + newState + ' is not a column in the spreadsheet .. but probably should be?')
  }
  return newState;
}

Worksheet.prototype.validateAndAdvanceState = function(orderNumber, fromState) {
  var rowIndex = this.searchForTransaction('Order Number', parseInt(orderNumber));
  if (rowIndex == -1) {
    Browser.msgBox("Unable to locate Order Number: " + orderNumber);
    return -1;
  }
  if (this.order_states.indexOf(fromState) == -1){
    Browser.msgBox("State '"+fromState+" not found in state machine!");
    return -1;
  }

  var order = this.worksheet.getRowAsObject(rowIndex);

  // locate current state in state machine
  var current_state = order['Order State'];
  var stateIndex = this.order_states.indexOf(current_state);

  if (stateIndex == this.order_states.length - 1) {
    Browser.msgBox("Order: " + orderNumber + " is already at the end of the State Machine!");
    return -1;
  }

  // increment state
  var new_state = this.order_states[stateIndex + 1];
  var desired_new_state = this.order_states.indexOf(fromState) + 1;
  if (new_state != this.order_states[desired_new_state]){
    Browser.msgBox("Order " + orderNumber + " cannot transition to " + this.order_states[desired_new_state] + ' from ' + current_state);
    return -1;
  }

  // update state in object
  order['Order State'] = new_state;

  // test to make sure field is in spreadsheet
  if (!order.hasOwnProperty('Time ' + new_state)) {
    Logger.log('State: ' + new_state + ' is not a column in the spreadsheet .. but probably should be?');
  } else {
    // update state time in object only if it's a valid column
    order['Time ' + new_state] = convertISODate(new Date());
  }
  //commit state change and timestamp to spreadsheet
  this.worksheet.update(rowIndex, order);

  //TODO: set format for cell to be .setNumberFormat("hh:mmam");

  return rowIndex;
}
