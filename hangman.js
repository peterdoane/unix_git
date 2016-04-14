var pickWord = function () {
	var words = ['javascript', 'amazing', 'pancake',
	'styrofoam', 'batman', 'yoda'];
	var word = words[Math.floor(Math.random() * words.length)];
	//Return a random word
	return word;
};

var setupAnswerArray = function (word) {
	// Return answer array
	var answerArray = [];
	for (var i = 0; i < word.length; i++) {
		answerArray[i] = '_';
	}
	return answerArray;
};

var word = pickWord();
var answerArray = setupAnswerArray(word);
var remainingLetters = word.length;
console.log(word,answerArray,remainingLetters);

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

var showAnswerAndCongratulatePlayer = function (answerArray) {
//Use alert to show the answer and congratulate the player
	alert(answerArray.join(" "));
	alert("Good job! the answer was " + word);
};

while (remainingLetters > 0) {
	showPlayerProgress(answerArray);
	var guess = getGuess();
	if (guess === null) {
		break;
	} else if (guess.length !== 1) {
	  alert("Please enter a single letter.");
	} else {
	  var correctGuesses = updateGameState(guess, word, answerArray);
	  remainingLetters -= correctGuesses;
	  console.log(remainingLetters);
	  console.log(correctGuesses);
	}
}

showAnswerAndCongratulatePlayer(answerArray);


//make sure updategamestate returns a number
//make sure that answer array is getting set to acutal array


