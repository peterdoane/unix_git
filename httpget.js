var http = require ('http');
http.get(process.argv[2], function(res) {
	res.on('data', function(data){ 
		console.log(data.toString());
	});
}).on('error', function(e) {
		console.log("Got error: " + e.message);
});





// http.get("http://www.google.com/index.html", function(res) {
//   console.log("Got response: " + res.statusCode);
// }).on('error', function(e) {
//   console.log("Got error: " + e.message);
// });