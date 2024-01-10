// games.js

const words = ["apple", "banana", "carrot", "date", "eggplant", "fig", "grape", "honeydew", "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tomato", "ugli fruit", "watermelon", "zucchini", "yam", "xigua", "cucumber", "broccoli", "avocado", "bell pepper", "dragon fruit", "elderberry", "jicama", "kale", "lettuce", "mushroom", "olive", "peach", "pear", "radish", "spinach", "tangerine", "blueberry", "cauliflower", "durian", "endive", "figs", "grapefruit", "jackfruit", "kiwano", "lime", "lychee", "okra"
];
let wordToGuess = "";
let guessedLetters = [];
let wrongGuesses = 0;
let wrongLetters = [];

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


function updateWrongGuessesDisplay() {
    const wrongGuessesElement = document.getElementById('wrong-guesses-list');
    if (wrongGuessesElement) {
        wrongGuessesElement.textContent = wrongLetters.join(', ');
    }
}

function updateHangmanImage(wrongGuesses) {
    console.log("Updating hangman image, wrong guesses:", wrongGuesses);
    const imageElement = document.getElementById('hangman-image');
    if (imageElement) {
        console.log("New image source:", hangmanImages[wrongGuesses]);
        imageElement.src = hangmanImages[wrongGuesses];
    } else {
        console.log("Hangman image element not found");
    }
}

function startGame() {
    wordToGuess = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    wrongGuesses = 0;
    wrongLetters = [];
    updateHangmanImage(wrongGuesses);
    updateWrongGuessesDisplay();
    displayWord();

    // Reset button styles
    const letterButtons = document.querySelectorAll('#letter-buttons button');
    letterButtons.forEach(button => {
        button.classList.remove('guessed');
        button.disabled = false;
    });
}


function makeGuess(guess) {
    console.log("Trying to disable button with ID:", "button-" + guess);
    guess = guess.toLowerCase(); // Convert guess to lowercase
    let wordToGuessLower = wordToGuess.toLowerCase(); // Convert wordToGuess to lowercase

    console.log("Guessed letter: ", guess);
    if (wordToGuessLower.includes(guess)) {
        console.log("Correct guess");
        if (!guessedLetters.includes(guess)) {
            guessedLetters.push(guess);
            displayWord();
        }
    } else {
        console.log("Incorrect guess");
        if (!wrongLetters.includes(guess)) {
            wrongLetters.push(guess);
            wrongGuesses++; // Increment wrongGuesses
            updateHangmanImage(wrongGuesses);
            updateWrongGuessesDisplay();
        }
    }
    document.getElementById("button-" + guess).classList.add('guessed');

    checkGameOver();
    document.getElementById("button-" + guess).disabled = true; // Disable guessed letter button
}

function updateWrongGuessesDisplay() {
    const wrongGuessesElement = document.getElementById('wrong-guesses-list');
    if (wrongGuessesElement) {
        wrongGuessesElement.textContent = wrongLetters.join(', ');
    }
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

document.addEventListener('DOMContentLoaded', function() {

startGame();
});

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
