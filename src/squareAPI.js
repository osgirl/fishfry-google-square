function squareAPI() {

}

squareAPI.prototype.call = function(url, params) {
  if (params == undefined || params == null) {
    params = {};
  }
  // always include authorization in header
  if (!('headers') in params) {
    params['headers'] = {
      "Authorization": "Bearer " + PropertiesService.getScriptProperties().getProperty("SQUARE_ACCESS_TOKEN")
    }
  }
  try {
    var response = UrlFetchApp.fetch(url, params);
    return JSON.parse(response.getContentText());
  } catch (e) {
    return "";
  }
}

/**
 * Retrieves order information from the Square V1 Payment API.
 *
 * Assumes SQUARE_ACCESS_TOKEN for authentication is stored in Script Property of same name
 *
 * @param {string} locationId
 *   Location ID corresponding to Square Location
 * @param {string} orderId
 *   Order ID corresponding to Square Payment object
 * @returns {object} payment object from Square V1 API
 *   https://docs.connect.squareup.com/api/connect/v1#datatype-payment
 * @throws Will throw an error if the API call to Square is not successful for any reason
 */
squareAPI.prototype.OrderDetails = function(locationId, orderId){
  var url = "https://connect.squareup.com/v1/" + locationId + "/payments/" + orderId;
  return this.call(url);
}

/**
 * Retrieves the origin of a given order from the Square V2 Transactions API.
 *
 * Assumes SQUARE_ACCESS_TOKEN for authentication is stored in Script Property of same name
 *
 * @param {string} locationId
 *   Location ID corresponding to Square Location
 * @param {string} orderId
 *   Order ID corresponding to Square Payment object
 * @param {string} created_at
 *   date when the order was created in RFC3339 format (e.g. 2016-01-15T00:00:00Z)
 * @returns {object} payment object from Square V2 API
 *   https://docs.connect.squareup.com/api/connect/v1#datatype-payment
 * @throws Will throw an error if the transaction can not be found or
 *         if the API call to Square is not successful for any reason
 */
squareAPI.prototype.TransactionDetails = function(locationId, orderId, created_at) {
  // when sort_order parameter is ASC, the results will be inclusive of the record we're looking for.
  var url = "https://connect.squareup.com/v2/locations/" + locationId + "/transactions?begin_time=" + created_at + "&sort_order=ASC";
  return this.call(url);
}


/**
 * Retrieves the customer's last name (aka family name) for a specified customer record
 *
 * Assumes SQUARE_ACCESS_TOKEN for authentication is stored in Script Property of same name
 * Uses Square Connect V2 API as the V1 API does not expose customer objects
 *
 * @param {string} customerId
 *   Customer ID corresponding to Square Customer Object
 * @returns {string} customer's last name
 * @throws Will throw an error if the API call to Square is not successful for any reason (including customer_id not found)
 */
squareAPI.prototype.CustomerFamilyName = function(customer_id) {
  Logger.log(customer_id);
  if (customer_id == "")
    return "";

  var url = "https://connect.squareup.com/v2/customers/" + customer_id;
  responseObj = this.call(url);

  try {
    return responseObj.customer.family_name;
  } catch (e) {
    return "";
  }
}

squareAPI.prototype.TransactionMetadata = function (locationId, orderId, created_at) {
  var responseObj = this.TransactionDetails(locationId, orderId, created_at);
  // the Square V1 API returns the payment information;
  // the Square V2 API nests this data underneath a transaction object
  var origin = "";
  var customer_id = "";
  var note = "";

  // because we're searching on a time-based window, the call may return up to 50 transactions (via pagination).
  // we safely? assume that our transactional load is so low that we do not receive more than 50 transactions within the same second.
  // the following for-each loop finds the appropriate transaction object that corresponds to the payment ID (aka tender.id)
  responseObj.transactions.some ( function(txn) {
    txn.tenders.some( function (tender){
      if (tender.id == orderId) {
        origin = txn.product; //REGISTER or ONLINE_STORE or EXTERNAL_API
        customer_id = tender.customer_id; //we store this to query the customer's last name
        note = tender.note;
        return true;
      }
    });
    return origin !== "";
  });

  if (origin == "")
    throw "Transaction " + orderId + " not found in TransactionMetadata!";

  return {origin: origin, customer_id: customer_id, note: note};
}

var api = squareAPI();