// games.js

const words = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];
let wordToGuess = "";
let guessedLetters = [];

function startGame() {
    wordToGuess = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    displayWord();
}

function displayWord() {
    const wordDisplay = document.getElementById("word-display");
    wordDisplay.innerHTML = "";
    for (const letter of wordToGuess) {
        if (guessedLetters.includes(letter)) {
            wordDisplay.innerHTML += letter + " ";
        } else {
            wordDisplay.innerHTML += "_ ";
        }
    }
}

function makeGuess() {
    const guessInput = document.getElementById("guess-input");
    const guess = guessInput.value.toLowerCase();
    if (guess.length === 1 && /[a-z]/.test(guess) && !guessedLetters.includes(guess)) {
        guessedLetters.push(guess);
        displayWord();
        checkGameOver();
    }
    guessInput.value = "";
}

function checkGameOver() {
    if (wordToGuess.split("").every(letter => guessedLetters.includes(letter))) {
        alert("Congratulations! You guessed the word: " + wordToGuess);
        startGame();
    }
}

startGame();


document.getElementById('random').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the default form submission
    generateRandomSentence(); // Calls your function to generate a sentence
});

function generateRandomSentence() {
    // Your existing logic to generate a random sentence
    // For example, you can modify the content of a specific element on the page
    var sentence = "Your generated sentence"; // Replace this with actual sentence generation logic
    document.getElementById('output').innerHTML = sentence; // Assuming 'output' is the ID of the element where you want to display the sentence
}
