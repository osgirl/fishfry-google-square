function FormatOrder() {
  this.api = new squareAPI();
}

/**
 * Get atomically incrementing order number
 * 
 * The Document Properties store is used to persist the value.
 *
 * @returns {integer} next order number for use
 */
FormatOrder.prototype.getOrderNumberAtomic = function() {
  //TODO: be sure there is no possibility of deadlock here...

  // get global lock before fetching property
  var lock = LockService.getDocumentLock();
  while (!lock.tryLock(1000)) {
    Logger.log('failed to get lock, trying again');
  }
  // we have the lock if we've gotten this far
  var next = null;

  try {
    var props = PropertiesService.getDocumentProperties();
  
    var current = props.getProperty('atomicOrderNumber');
    if (current == null) { //not stored yet
      next = "2018";
    }
    else {
      next = (parseInt(current) + 1).toFixed();
    }
    props.setProperty('atomicOrderNumber', next);
  }
  catch (e) {
    Logger.log(e);
  }
  finally {
    lock.releaseLock();
  }

  if (next === null) {
    // TODO: should this have a backup method when this condition happens?
    throw "Unable to acquire next order number!"
  }

  return next;
};


/**
 * Retrieves the appropriate order state based on where an order was received
 *
 * @param {string} origin
 *   Square product that processed order
 * @returns {string} appropriate state
 * @throws Will throw an error if Square product string is unknown
 */
FormatOrder.prototype.getStateFromOrigin = function (origin){
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
 * Appends or updates a row in the current transaction sheet for a new inbound transaction
 *
 * Invokes other functions that call out to Square APIs
 *
 * @param {string} location_id
 *   Location ID corresponding to Square Location
 * @param {string} payment_id
 *   Order ID corresponding to Square Payment object
 */
//Order.prototype.upsertTransactionLog = function (location_id, payment_id){
FormatOrder.prototype.SquareTransactionToSheet = function (location_id, payment_id) {
  // try to get updated order details from Square
  var orderDetails = this.api.OrderDetails(location_id, payment_id);
  var txnMetadata = this.api.TransactionMetadata(location_id, payment_id, orderDetails.created_at);
  var lastName = this.api.CustomerFamilyName(txnMetadata.customer_id);
  return this.ConvertSquareToSheet(txnMetadata, orderDetails, lastName);
}

FormatOrder.prototype.ConvertSquareToSheet = function(txnMetadata, orderDetails, lastName) {
  // convert Square schema to Sheet schema
  var order = new menuItems();
  orderDetails.itemizations.forEach( function (item) {
    //item.name will be for meals
    var key = item.name;
    if (item.item_variation_name == "Child") {
      if (order.items[key].serving == 'MEAL') {
        key += ' (Child)';
      }
    }
    if (!(key in order.items)) {
      Logger.log("unknown menu item found in Square Order: " + item);
    }
    order.items[key].increment_quantity(item.quantity);

    //sides are stored in "item modifiers"
    item.modifiers.forEach( function(modifier) {
      var side = modifier.name;

      //Mac and Cheese can be both a side & a meal so we need a special case for it
      if (side == "Mac & Cheese") {
        side += ' (Side)';
      }
      if (!(side in order.items)) {
        Logger.log("unknown side item found in Square Order: " + modifier);
      }
      order.items[side].increment_quantity(item.quantity);
    });
  });

  // get totals for Sheet
  var ingredients = order.ingredientTotals();
  var mealCount = order.servingCount('MEAL');
  var soupCount = order.servingCount('SOUP');
  var orderNumber = this.getOrderNumberAtomic();
  var fmtLabel = new FormatLabel();

  // format data for Sheet
  var result = {
    "Order Number": orderNumber,
    "Payment ID": orderDetails.id,
    "Total Amount": parseInt(orderDetails.total_collected_money.amount)/100,
    "Order Received Date/Time": convertISODate(new Date(orderDetails.created_at)),
    "Last Name": lastName, //TODO: timing issue around fetching this prematurely?
    "Expedite": "No",
    "Note on Order": txnMetadata.note,//TODO: not sure this is the correct field
    "Label Doc Link": fmtLabel.createLabelFile(orderNumber, orderDetails, txnMetadata, lastName, mealCount, soupCount),
    "Order Venue": (this.getStateFromOrigin(txnMetadata.origin) == "Present") ? "In Person" : "Online",
    "Order State": this.getStateFromOrigin(txnMetadata.origin),
    "Square Receipt Link": orderDetails.receipt_url,
    "Time Present": (this.getStateFromOrigin(txnMetadata.origin) == "Present") ? convertISODate(new Date()) : "", //TODO: fix date formatting
    "Total Meals": mealCount,
    "Total Soups": soupCount,
    "Soup": soupCount
  };
  // Add item details
  for (var attrname in ingredients) {
    result[attrname] = ingredients[attrname];
  }

  if (result['Label Doc Link'] == '') {
    // attempt to create the label again, using the data from Sheet rather than
    result['Label Doc Link'] = createLabelFileFromSheet(result);
  }

  return result;
}
