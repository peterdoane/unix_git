var fs = require ('fs');
var filtersLS = function(directoryName, fileNameExtension,callbackFunction){
	fs.readdir(directoryName,function callback(err,list){
		if (err){
			return callbackFunction(err);
		}	
		var newArray =[];
		var re = new RegExp('.' + fileNameExtension + '$', 'g');
		for (var i = 0; i <list.length; i++){
			if (list[i].match(re)) {
				newArray.push(list[i]);

			}
		}
		callbackFunction(undefined,newArray);
	})	
};


module.exports = filtersLS;