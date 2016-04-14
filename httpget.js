var http = require ('http');
http.get(process.argv[2], function(res) {
	var result = '';
	res.on('data', function(data){ 
		console.log(data.toString());
		result += data.toString();	
	});
	var responseData = JSON.parse(result);
		var docs = responseData['docs'];
		for(var i in docs) {
			console.log(docs[i]['snippet']);
		}
}).on('error', function(e) {
		console.log("Got error: " + e.message);
});





// http.get("http://www.google.com/index.html", function(res) {
//   console.log("Got response: " + res.statusCode);
// }).on('error', function(e) {
//   console.log("Got error: " + e.message);
// });