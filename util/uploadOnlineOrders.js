var fs = require('fs');
var csv = require('csv');
const https = require('https');
const { URL } = require('url');

if (process.argv.length !== 4) {
  console.error('invalid number of arguments');
  return 1;
}


//argv[2] is filename, argv[3] is url of web app endpoint
//parse input
var parser = csv.parse({columns:true}, function(err, data){

  //console.log(data);

  var url = new URL(process.argv[3]);
  //put queryParam of 'uploadOnlineOrderData' on url
  if (url.searchParams.get('uploadOnlineOrder') == null) {
    url.searchParams.append('uploadOnlineOrder','true');
  }

  var options = {
    host: url.hostname,
    port: url.port,
    path: url.pathname + '?' + url.searchParams.toString(),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(data))
    }
  };

  const req = https.request(options, function(res) {
    console.log('RESPONSE STATUS: ' + res.statusCode);
    console.log('RESPONSE HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('RESPONSE BODY: ' + chunk);
    });
  });

  req.write(JSON.stringify(data));

  req.end();
});

fs.createReadStream(process.argv[2]).pipe(parser);
