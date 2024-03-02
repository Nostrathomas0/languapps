// games.js
//_         __      __   _     _       _     _      __      ___      ___      __  
// |       /  \    |  \ | |   //  __  | |   | |    /  \    |   \    |   \    / _/
// |      / /\ \   | |\\| |  ((  |_ | | |   | |   / /\ \   | () )   | () )  ( (
// |__   /  __  \  | | \  |   \\__//  |  \_/  |  /  __  \  | __/    | __/   _) )
//____| /__/  \__\ |_|  \_|    \__/    \_____/  /__/  \__\ |_|      |_|     \__/

// Section 0 Global Variables
let wordToGuess = "";
let guessedLetters = [];
let wrongGuesses = 0;
let wrongLetters = [];

// Section 1 Exporting Gane functions
// Hangman Functions
export function startGame() { 
    wordToGuess = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    wrongGuesses = 0;
    wrongLetters = [];
    updateHangmanImage(wrongGuesses);
    displayWord();
     // Reset button styles
     const letterButtons = document.querySelectorAll('#letter-buttons button');
     letterButtons.forEach(button => {
         button.classList.remove('guessed');
         button.disabled = false;
     });
 }
 export function makeGuess(letter) { 
    console.log("Trying to disable button with ID:", "button-" + letter);
    letter = letter.toLowerCase(); // Convert letter to lowercase
    let wordToGuessLower = wordToGuess.toLowerCase(); // Convert wordToGuess to lowercase

    console.log("Guessed letter: ", letter);
    if (wordToGuessLower.includes(letter)) {
        console.log("Correct guess");
        if (!guessedLetters.includes(letter)) {
            guessedLetters.push(letter);
            displayWord();
        }
    } else {
        console.log("Incorrect guess");
        if (!wrongLetters.includes(letter)) {
            wrongLetters.push(letter);
            wrongGuesses++; // Increment wrongGuesses
            updateHangmanImage(wrongGuesses);
        }
    }
    document.getElementById("button-" + letter).classList.add('guessed');
    document.getElementById("button-" + letter).disabled = true; // Disable guessed letter button

    checkGameOver();
}

export function playSound(soundName) {
    const soundPath = `assets/sounds/${soundName}`;
    const sound = new Audio(soundPath);
    sound.play();
}

// Section 2 Analytics and Tracking 

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-171464578-1');

!function(f,b,e,v,n,t,s){
    if(f.fbq)return;
    n=f.fbq=function(){
        n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)
    };
    if(!f._fbq)f._fbq=n;n.push=n;
    n.loaded=!0;
    n.version='2.0';
    n.queue=[];
    t=b.createElement(e);
    t.async=!0;
    t.src=v;
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); 
fbq('init', '348427750356175'); 
fbq('track', 'PageView');



// Section 4a Hangman Variables

const words = ["apple", "banana", "carrot", "date", "eggplant", "fig", "grape", "honeydew", "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tomato", "ugli fruit", "watermelon", "zucchini", "yam", "xigua", "cucumber", "broccoli", "avocado", "bell pepper", "dragon fruit", "elderberry", "jicama", "kale", "lettuce", "mushroom", "olive", "peach", "pear", "radish", "spinach", "tangerine", "blueberry", "durian", "endive", "figs", "grapefruit", "jackfruit", "kiwano", "lime", "lychee", "okra"];

wordToGuess = "";
guessedLetters = [];
wrongGuesses = 0;
wrongLetters = [];

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

// Section 4b 

function updateHangmanImage(wrongGuesses) {
    console.log("Updating hangman image, wrong guesses:", wrongGuesses);
    const imageElement = document.getElementById('hangman-image');
    if (imageElement) {
        let imageIndex = wrongGuesses < hangmanImages.length ? wrongGuesses : hangmanImages.length - 1;
        console.log("New image source:", hangmanImages[wrongGuesses]);
        imageElement.src = hangmanImages[imageIndex];
    } else {
        console.log("Hangman image element not found");
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

// Section 5b Random sentence 

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

// DOM Content 

document.addEventListener('DOMContentLoaded', function() {
    
// Start the hangman game
startGame();


// Set up the cookie consent modal
var modal = document.getElementById('cookie-consent-modal');
var acceptBtn = document.getElementById('accept-cookies');
var declineBtn = document.getElementById('decline-cookies');
var bodyContent = document.querySelector('.main-content');
var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var startGameButton = document.getElementById('start-game');


// Only show modal if cookie consent hasn't been given
console.log("Checking cookie consent status");
if (!getCookie('cookieConsent')) {
    console.log("No cookie consent found, displaying modal");
    modal.style.display = 'block';
    bodyContent.classList.add('blur-background');
}



// Start Game button 
if (startGameButton) {
    startGameButton.addEventListener('click', startGame);
}

// Setup event listeners for letter buttons
letters.forEach(function(letter) {
    var button = document.getElementById('button-' + letter);
    if (button) {
        button.addEventListener('click', function() {
            makeGuess(letter);
        });
    }
});

// Set up the random sentence generator form submission
document.getElementById('random').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting in the traditional way
    generateRandomSentence(); // Call the function to generate and display the sentence
});

// Additional code if needed
});


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



