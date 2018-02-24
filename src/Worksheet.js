function Worksheet(spreadsheet_id, worksheet_name) {
    spreadsheet_id = '1NbNqn87RH-T9CoScqKejJlSxOo_CW4VMUnDKzgcE8TU';
    worksheet_name = "Current Event Transaction Log";

    // https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openbyidid
    // The code below opens a spreadsheet using its ID and logs the name for it.
    // Note that the spreadsheet is NOT physically opened on the client side.
    // It is opened on the server only (for modification by the script).
    this.spreadsheet = new ManagedSpreadsheet(spreadsheet_id);
    this.worksheet = this.spreadsheet.sheet(worksheet_name);
}

/**
 * Searches transaction log to see if an entry exists for a given ID
 *
 * @param {string} order_id
 *   Order ID corresponding to Square Payment
 * @returns {integer} row_index
 *   Returns the row number corresponding to the entry if present, -1 if not present
 */
Worksheet.prototype.searchTransactionLog = function (order_id){
  return this.worksheet.rowIndex('Order Number', order_id);
}

/**
 * Appends or updates a row in the current transaction sheet for a new inbound transaction
 *
 * @param {object} txnMetadata
 *   Output from fetchTransactionMetadata()
 *   https://docs.connect.squareup.com/api/connect/v1#datatype-payment
 * @param {obj} orderDetails
 *   Output from fetchOrderDetails()
 */
Worksheet.prototype.upsertTransaction = function (order) {
    // if the transaction hasn't been inserted yet
    if (this.searchTransactionLog(order['Order Number']) == -1) {

      this.worksheet.append(order);

      // TODO: set formula for wait time in "Current Wait Time" column for the row you just inserted
    }
    else{
      //update

      //TODO: update order, then update row?
      //TODO: determine if refund, then delete row from table
    }
 }