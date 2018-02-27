
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