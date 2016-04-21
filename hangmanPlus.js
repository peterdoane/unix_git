var setupAnswerArray = function (word) {
	// Return answer array
	var answerArray = [];
	for (var i = 0; i < word.length; i++) {
		answerArray[i] = '_';
	}
	return answerArray;
};


var showPlayerProgress = function (answerArray) {
	//Use alert to show the player their progress
	alert(answerArray.join(" "));
};

var getGuess = function () {
	//Use prompt to get a guess
	return prompt("guess a letter, or click Cancel to stop playing.");
	//challenge what happens if word has two of the same letters
};

var updateGameState = function (guess, word, answerArray) {
	//Update answerArray and return a number showing how many
	//times the guess apears in the word so remainingLetters
	//can be updated
	var letterMatch = 0;
	for (var j = 0; j < word.length; j++) {
		if(word[j] === guess) {
			answerArray[j] = guess;
			letterMatch++;
		}
	}
	return letterMatch;
};

var showAnswerAndCongratulatePlayer = function (answerArray,word) {
//Use alert to show the answer and congratulate the player
	alert(answerArray.join(" "));
	alert("Good job! the answer was " + word);
};


var requestStr = "http://randomword.setgetgo.com/get.php";

$.ajax({
    type: "GET",
    url: requestStr,
    dataType: "jsonp",
    jsonpCallback: 'mainFunction'
});

function mainFunction(data){
	var word = data.Word;
	var answerArray = setupAnswerArray(word);
	var remainingLetters = word.length;
	console.log(word,answerArray,remainingLetters);
	var correctGuessesArr = [];

	while (remainingLetters > 0){
		showPlayerProgress(answerArray);
		var guess = getGuess();
		if (guess === null) {
			break;
		} else if (guess.length !== 1) {
		  alert("Please enter a single letter.");
		} else {
		  var correctGuesses = updateGameState(guess, word, answerArray);
		  if(correctGuesses >= 1 && (correctGuessesArr.indexOf(guess) === -1)) {
		  	correctGuessesArr.push(guess);
		  	remainingLetters -= correctGuesses;
		  }
		  console.log(remainingLetters);
		  console.log(correctGuesses);
		  console.log(answerArray);
		  console.log(correctGuessesArr);
		}
	}
	showAnswerAndCongratulatePlayer(answerArray,word);

}


//make sure updategamestate returns a number
//make sure that answer array is getting set to acutal array


