var mymodule = require ('./mymodule'); 
mymodule(process.argv[2],process.argv[3],function callBack(err, list){
	if (err){
		console.log(err);
	}
	for (var i in list){
		console.log(list[i]);
	}
});
  