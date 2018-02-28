function doGet(e) {
  Logger.log('doGet');
  return HtmlService.createHtmlOutput("doGet from fish fry");
}

/**
 * This script processes the webhook request from the Square Connect V1 API which
 * indicates that an order has been created or updated. We use the information
 * passed in the webhook request to query the Square Connect API for additional
 * order information (meals, sides, quantities, etc).
 * 
 * NOTE: Google Apps Script will not show us POST headers, so we'll have to trust that 
 * the input is valid from the webhook... normally we should be doing an HMAC-SHA1 on
 * a request header, but since GAS won't show us the value we can't validate it.
 * 
 * We are expecting data in payload that looks like this:
 * {
 *   "merchant_id": "18YC4JBH91E1H",
 *   "location_id": "JGHJ0343",
 *   "event_type": "PAYMENT_UPDATED",
 *   "entity_id": "Jq74mCczmFXk1tC10GB"
 * }
 * 
 * https://docs.connect.squareup.com/api/connect/v1#setupwebhooks
 */
function doPost(e) {  
  console.log('doPost: received payload: ' + e);

  if (e.hasOwnProperty('postData') && e.postData.type != "application/json") {
    var errMsg = "doPost: invalid input content type for payload";
    console.error(errMsg);
    throw errMsg;
  }
  
  var input = JSON.parse(e.postData.contents);
  console.log("doPost: webhook contents: " + e.postData.contents);
  
  // PAYMENT_UPDATED will be sent regardless of creation or update
  if (input.event_type == 'PAYMENT_UPDATED'){
    var fmt_order = new FormatOrder();
    var worksheet = new Worksheet();
    var txn = fmt_order.SquareTransactionToSheet(input.location_id, input.entity_id);
    worksheet.upsertTransaction(txn);
  }
  
  // return an HTTP 200 OK with no content for webhook request
  return HtmlService.createHtmlOutput("");
}
