var fs = require ('fs');
fs.readdir(process.argv[2],function callback(err,list){
	var re = new RegExp('.' + process.argv[3] + '$', 'g');
	for (var i = 0; i <list.length; i++){
		if (list[i].match(re)) {
			console.log(list[i]);
		}
	}
});

