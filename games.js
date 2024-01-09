// games.js

const words = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];
let wordToGuess = "";
let guessedLetters = [];
let wrongGuesses = [];

const hangmanImages = [
    '/images/hang/h0.png',
    '/images/hang/h1.png',
    '/images/hang/h2.png',
    '/images/hang/h3.png',
    '/images/hang/h4.png',
    '/images/hang/h5.png',
    '/images/hang/h6.png',
    '/images/hang/h7.png',
    '/images/hang/h8.png',
    '/images/hang/h9.png',
    '/images/hang/h10.png'
];


function updateGuessedLettersDisplay() {
    const guessedLettersElement = document.getElementById('guessed-letters-list');
    guessedLettersElement.textContent = guessedLetters.join(', ');
}


function updateHangmanImage(wrongGuesses) {
    const imageElement = document.getElementById('hangman-image');
    imageElement.src = hangmanImages[wrongGuesses];
}


function startGame() {
    wordToGuess = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    wrongGuesses = 0;
    updateHangmanImage(wrongGuesses);
    updateGuessedLettersDisplay();
    displayWord();
}


function makeGuess(guess) {
    // Check if guessed letter is in the word
    if (wordToGuess.includes(guess)) {
        // Correct guess
        guessedLetters.push(guess);
    } else {
        // Wrong guess
        wrongGuesses++;
        updateHangmanImage(wrongGuesses);
       
    }

    updateGuessedLettersDisplay();
    displayWord();
    checkGameOver;
    document.getElementById("button-" +guess).disabled = true;


    displayWord();
    checkGameOver();
    // Disable the guessed letter button to prevent repeated guesses
    document.getElementById("button-" + guess).disabled = true;
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

function checkGameOver() {
    if (wordToGuess.split("").every(letter => guessedLetters.includes(letter))) {
        // Play win sound and show message
        playSound('win_sound.mp3');  // Replace with your sound file path
        alert("Congratulations! You guessed the word: " + wordToGuess);
        startGame();
    } else if (wrongGuesses >= hangmanImages.length - 1) {
        // Play lose sound and show message
        playSound('lose_sound.mp3');  // Replace with your sound file path
        alert("Game over! The word was: " + wordToGuess);
        startGame();
    }
}

function playSound(soundFile) {
    const audio = new Audio(soundFile);
    audio.play();
}


startGame();


document.getElementById('random').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the default form submission
    generateRandomSentence(); // Calls your function to generate a sentence
});

   
const pronouns = {
    subject: ['I', 'You', 'He', 'She', 'They'],
    object: ['me', 'you', 'him', 'her', 'them']
};

const verbs = ['love', 'hate', 'enjoy', 'dislike', 'prefer'];

const nounPhrases = {
    determiners: ['The', 'A', 'An', 'My', 'Your'],
    nouns: ['cat', 'dog', 'pizza', 'coding', 'music']
};

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomSentence() {
    // Elements for constructing the sentence
    const subjectPronouns = ['I', 'You', 'He', 'She', 'They'];
    const objectPronouns = ['me', 'you', 'him', 'her', 'them'];
    const determiners = ['the', 'a', 'an', 'my', 'your'];
    const nouns = ['cat', 'dog', 'pizza', 'music', 'car'];

    // Verbs in their base form
    const verbs = {
        base: ['love', 'hate', 'enjoy', 'dislike', 'prefer'],
        thirdPersonSingular: ['loves', 'hates', 'enjoys', 'dislikes', 'prefers']
    };

    // Helper functions
    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function isThirdPersonSingular(subject) {
        return !['I', 'You', 'They'].includes(subject);
    }

    function getSubject() {
        // Randomly choose between a pronoun or a noun phrase
        if (Math.random() < 0.5) {
            // Use a subject pronoun
            return getRandomElement(subjectPronouns);
        } else {
            // Use a noun phrase
            return `${getRandomElement(determiners)} ${getRandomElement(nouns)}`;
        }
    }

    function getObject() {
        // Randomly choose between an object pronoun or a noun phrase
        if (Math.random() < 0.5) {
            return getRandomElement(objectPronouns);
        } else {
            return `${getRandomElement(determiners)} ${getRandomElement(nouns)}`;
        }
    }

    // Generate the sentence
    const subject = getSubject();
    const verb = isThirdPersonSingular(subject) ? getRandomElement(verbs.thirdPersonSingular) : getRandomElement(verbs.base);
    const object = getObject();

    return `${subject} ${verb} ${object}.`;
}

// Example usage
const randomSentence = generateRandomSentence();
document.getElementById('random-sentence').innerHTML = randomSentence;

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('random').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting in the traditional way
        generateRandomSentence(); // Call the function to generate and display the sentence
    });
});
