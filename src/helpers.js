/**
 * Formats strings into Google Sheets-compliant output as: 03/14/2018 05:12PM
 *
 * @param {Date} date
 *   input date object to be formatted
 * @returns {string} formatted date
 */
function convertISODate(date){
// TODO: why isn't seconds here?
  return Utilities.formatDate(date, "EST", "MM/dd/yyyy hh:mma");
}

function pad(pad, str, padLeft) {
  if (typeof str === 'undefined')
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}

/**
 * Invokes UrlFetch.fetch with logging wrappers
 *
 * @param {string} url
 *   url to be fetched
 * @param {Object} params
 *   value of params Object to be passed to UrlFetchApp.fetch
 * @returns {Object} parsed response content into Javascript object
 */
function loggedUrlFetch(url, params) {
  try {
    console.log("loggedUrlFetch: invoking url " + url);
    var response = UrlFetchApp.fetch(url, params);
    console.log("loggedUrlFetch: returned  " + response.getContentText());
    return JSON.parse(response.getContentText());
  } catch (e) {
    console.error("loggedUrlFetch: UrlFetchApp.fetch() returned error  " + e);
    return {};
  }
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
}