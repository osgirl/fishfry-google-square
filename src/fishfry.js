function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Station Menu')
      .addItem('Labeling Station', 'showLabelingSidebar')
      .addItem('Ready Station', 'showReadySidebar')
      .addItem('Closing Station', 'showClosingSidebar')
      .addToUi();
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
function fetchOrderDetails(locationId, orderId){
  var params = {
    headers: {
      "Authorization": "Bearer " + PropertiesService.getScriptProperties().getProperty("SQUARE_ACCESS_TOKEN")
    },
  };
  
  var url = "https://connect.squareup.com/v1/" + locationId + "/payments/" + orderId;
  var response = UrlFetchApp.fetch(url, params);
  
  return JSON.parse(response.getContentText());  
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
 * @returns {object} payment object from Square V1 API 
 *   https://docs.connect.squareup.com/api/connect/v1#datatype-payment
 * @throws Will throw an error if the transaction can not be found or
 *         if the API call to Square is not successful for any reason
 */
function fetchTransactionMetadata(locationId, orderId, created_at){
  var params = {
    headers: {
      "Authorization": "Bearer " + PropertiesService.getScriptProperties().getProperty("SQUARE_ACCESS_TOKEN")
    },
  };
  
  // when sort_order parameter is ASC, the results will be inclusive of the record we're looking for.
  var url = "https://connect.squareup.com/v2/locations/" + locationId + "/transactions?begin_time=" + created_at + "&sort_order=ASC";
  
  var response = UrlFetchApp.fetch(url, params);
  var responseObj = JSON.parse(response.getContentText());
  
  console.log(response.getContentText());
  
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
    throw "Transaction " + orderId + " not found in fetchTransactionMetadata!";
  
  return {origin: origin, customer_id: customer_id, note: note};
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
function fetchCustomerFamilyName(customer_id) {
  Logger.log(customer_id);
  if (customer_id == "")
    return "";
  
  var params = {
    headers: {
      "Authorization": "Bearer " + PropertiesService.getScriptProperties().getProperty("SQUARE_ACCESS_TOKEN")
    },
  };
  
  var url = "https://connect.squareup.com/v2/customers/" + customer_id;
  
  try {
    var response = UrlFetchApp.fetch(url, params);
    var responseObj = JSON.parse(response.getContentText());
  
    console.log(response.getContentText());
    return responseObj.customer.family_name;
  }
  catch (e) {
    return "";
  }
}

/**
 * Retrieves the appropriate order state based on where an order was received
 * 
 * @param {string} origin
 *   Square product that processed order
 * @returns {string} appropriate state
 * @throws Will throw an error if Square product string is unknown
 */
function getStateFromOrigin(origin){
  switch (origin) {
    case "REGISTER":
      return "Present";
      break;
    case "ONLINE_STORE":
      return "Paid Online";
      break;
    default:
      throw "Unknown origin (" + origin + ") of transaction!";
  }
}

/**
 * Count meals from Square payment information
 */
function countMeals(orderDetails) {
  
  var result = {
    mealCount: 0,
    soupCount: 0,
    breadedFishAdult: 0,
    breadedFishChild: 0,
    bakedFishAdult: 0,
    bakedFishChild: 0,    
    breadedShrimpAdult: 0,
    breadedShrimpChild: 0,
    bakedShrimpAdult: 0,
    bakedShrimpChild: 0,
    comboBreadedAdult: 0,
    comboBreadedChild: 0,
    comboBakedAdult: 0,
    comboBakedChild: 0,
    macAndCheese: 0,
    grilledCheese: 0,
    fries: 0,
    redPotato: 0
  };    
    
  orderDetails.itemizations.forEach( function (item) {
    switch (item.name) {
      case "Hand Breaded Fish":
        if (item.item_variation_name == "Adult")
          result.breadedFishAdult += parseInt(item.quantity);
        else
          result.breadedFishChild += parseInt(item.quantity);
        break;
      case "Baked Fish":
        if (item.item_variation_name == "Adult")
          result.bakedFishAdult += parseInt(item.quantity);
        else
          result.bakedFishChild += parseInt(item.quantity);
        break;
      case "Hand Breaded Shrimp":
        if (item.item_variation_name == "Adult")
          result.breadedShrimpAdult += parseInt(item.quantity);
        else
          result.breadedShrimpChild += parseInt(item.quantity);
        break;
      case "Baked Shrimp":
        if (item.item_variation_name == "Adult")
          result.bakedShrimpAdult += parseInt(item.quantity);
        else
          result.bakedShrimpChild += parseInt(item.quantity);
        break;
      case "Combo Hand Breaded Fish & Shrimp":
        if (item.item_variation_name == "Adult")
          result.comboBreadedAdult += parseInt(item.quantity);
        else
          result.comboBreadedChild += parseInt(item.quantity);
        break;
      case "Combo Baked Fish & Shrimp":
        if (item.item_variation_name == "Adult")
          result.comboBakedAdult += parseInt(item.quantity);
        else
          result.comboBakedChild += parseInt(item.quantity);
        break;
      case "Mac & Cheese":
        result.macAndCheese += parseInt(item.quantity);
        break;
      case "Grilled Cheese":
        result.grilledCheese += parseInt(item.quantity);
        break;
      case "Clam Chowder Soup":
        result.soupCount += parseInt(item.quantity);
    }   
    item.modifiers.forEach( function (modifier) {
      switch(modifier.name) {
        case "French Fries":
          result.fries += item.quantity;
          break;
        case "Red Potato":
          Logger.log("in potato");
          result.redPotato += item.quantity;
          break;
      }
    });
  });
  
  result.mealCount = result.breadedFishAdult+ result.breadedFishChild + result.bakedFishAdult +   result.bakedFishChild+    result.breadedShrimpAdult+    result.breadedShrimpChild+    result.bakedShrimpAdult+    result.bakedShrimpChild+    result.comboBreadedAdult+    result.comboBreadedChild+    result.comboBakedAdult+    result.comboBakedChild+    result.macAndCheese+    result.grilledCheese;  
  
  return result;
  
}

/**
 * Appends or updates a row in the current transaction sheet for a new inbound transaction
 * 
 * Invokes other functions that call out to Square APIs
 *
 * @param {string} location_id
 *   Location ID corresponding to Square Location
 * @param {string} payment_id
 *   Order ID corresponding to Square Payment object
 */
function upsertTransactionLog(location_id, payment_id){
  
  try {
    // try to get updated order details from Square
    var orderDetails = fetchOrderDetails(location_id, payment_id);
    console.log(orderDetails);
    // compute meal counts
    var mealCounts = countMeals(orderDetails);
    
    // if the transaction hasn't been 
    if (searchTransactionLog(orderDetails.id) == -1) {
      var txnMetadata = fetchTransactionMetadata(location_id, payment_id, orderDetails.created_at);
   
      var lastName = fetchCustomerFamilyName(txnMetadata.customer_id);
      var result = {
        "Order Number": orderDetails.id,
        "Order Received Date/Time": orderDetails.created_at, //format for Date formatter
        "Last Name": lastName, //TODO: timing issue around fetching this prematurely?
        "Expedite": "No",
        "Note on Order": "",
        "Label Doc Link": createLabelFile(orderDetails, lastName, mealCounts.mealCount, mealCounts.soupCount),
        "Order Venue": (getStateFromOrigin(txnMetadata.origin) == "Present") ? "In Person" : "Online",
        "Order State": getStateFromOrigin(txnMetadata.origin),
        "Square Receipt Link": orderDetails.receipt_url,
        "Time Present": (getStateFromOrigin(txnMetadata.origin) == "Present") ? new Date().toISOString() : "", //TODO: fix date formatting
        "Total Meals": mealCounts.mealCount,
        "Total Soups": mealCounts.soupCount,
        "Breaded Fish": mealCounts.breadedFishAdult + mealCounts.breadedFishChild + (mealCounts.comboBreadedAdult + mealCounts.comboBreadedChild)*.5,  //TODO: weight based on combo, adult vs child servings from "Settings" sheet
        "Baked Fish": mealCounts.bakedFishAdult + mealCounts.bakedFishChild + (mealCounts.comboBakedAdult + mealCounts.comboBakedChild)*.5,  //TODO: weight based on combo, adult vs child servings from "Settings" sheet
        "Breaded Shrimp": mealCounts.breadedShrimpAdult + mealCounts.breadedShrimpChild + (mealCounts.comboBreadedAdult + mealCounts.comboBreadedChild)*.5,  //TODO: weight based on combo, adult vs child servings from "Settings" sheet
        "Baked Shrimp": mealCounts.bakedShrimpAdult + mealCounts.bakedShrimpChild + (mealCounts.comboBakedAdult + mealCounts.comboBakedChild)*.5,  //TODO: weight based on combo, adult vs child servings from "Settings" sheet
        "Mac & Cheese": mealCounts.macAndCheese,
        "Grilled Cheese": mealCounts.grilledCheese,
        "French Fries": mealCounts.fries,
        "Red Potato": mealCounts.redPotato,
        "Soup": mealCounts.soupCount        
      };
      
      var spreadsheet = new ManagedSpreadsheet('1NbNqn87RH-T9CoScqKejJlSxOo_CW4VMUnDKzgcE8TU');
      var worksheet = spreadsheet.sheet("Current Event Transaction Log");
      worksheet.append(result);
      
      // TODO: set formula for wait time in "Current Wait Time" column for the row you just inserted
    }
    else{
      //update
      
      //TODO: update order, then update row?
      //TODO: determine if refund, then delete row from table
    }
    
    
  }
  catch(e) {
    throw e;
  }
  
}

/**
 * Searches transaction log to see if an entry exists for a given ID
 *
 * @param {string} order_id
 *   Order ID corresponding to Square Payment
 * @returns {integer} row_index
 *   Returns the row number corresponding to the entry if present, -1 if not present
 */
function searchTransactionLog(order_id){
  
  //TODO: move ID to global
  var spreadsheet = new ManagedSpreadsheet('1NbNqn87RH-T9CoScqKejJlSxOo_CW4VMUnDKzgcE8TU');
  var worksheet = spreadsheet.sheet("Current Event Transaction Log");
  
  return worksheet.rowIndex('Order Number', order_id);  
}

function bob(){
  upsertTransactionLog("62RAE2R9VQP18","GEb5msQzmanLVmHxZ3s7KQB");
  /* these values come from webhook inbound to doPost method
  var obj = fetchOrderDetails("62RAE2R9VQP18","PXp3qHXYsuYwvmI8okY3wyMF");
  
  Logger.log(obj.created_at);
  var origin = fetchTransactionMetadata("62RAE2R9VQP18","PXp3qHXYsuYwvmI8okY3wyMF", obj.created_at);
  console.log(fetchCustomerFamilyName(origin.customer_id))
  /*
  Logger.log(obj.id);
  Logger.log(obj.receipt_url);
  obj.itemizations.forEach( function(item) {
    Logger.log("(" + parseInt(parseInt(item.quantity)) + ") " + item.name + " (" + item.item_variation_name + ")");
    for each (var modifier in item.modifiers) {
      Logger.log("   Side: " + modifier.name);
    }
  });
  
  //create labels from obj
  
TtZ35VJJggS8PhMUwTgUjxMF
MlEKY24hcTFOyRSkEfZBKQB
wJN4VLZM3Jg9DWz6WNePLQB
aG5KOyzb6DG9hcNpy5GNKQB
au3jeZNqZNehUafSL124KQB
6ezFgNuoj7QkKJVDuEEYKQB
  
  if (result.orderState == "Present")
    result.timePresent = (new Date()).toISOString(); //TODO:fix this
  
  Logger.log(result);
  */
}
