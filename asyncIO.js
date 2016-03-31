var fs = require ('fs');
fs.readFile(process.argv[2], {encoding: 'ascii'}, function (err, data)
{
	if (err) throw err;
	var list = data.split('\n');
	var newLines = list.length -1;
	console.log(newLines);
});

