// games.js
// Section 0
// Gtag & FBpixel 
	
		
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

// Section 1
// Hangman Game

const words = ["apple", "banana", "carrot", "date", "eggplant", "fig", "grape", "honeydew", "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tomato", "ugli fruit", "watermelon", "zucchini", "yam", "xigua", "cucumber", "broccoli", "avocado", "bell pepper", "dragon fruit", "elderberry", "jicama", "kale", "lettuce", "mushroom", "olive", "peach", "pear", "radish", "spinach", "tangerine", "blueberry", "durian", "endive", "figs", "grapefruit", "jackfruit", "kiwano", "lime", "lychee", "okra"];
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

function startGame() {
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
            }
    }
    document.getElementById("button-" + guess).classList.add('guessed');

    checkGameOver();
    document.getElementById("button-" + guess).disabled = true; // Disable guessed letter button
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



// Section 2
// Random sentence generator
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



//Section 3 Cookies
//Cookie setter
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setDate(date.getDate() + days);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function setLanguagePreference(language) {
    setCookie('userLanguage', language, 30); // Store the language preference
    applyLanguageSettings(language); // Apply the language immediately
}

function setLanguagePreference(language) {
    setCookie('userLanguage', language, 30); // Store the language preference for 30 days
}

function applyLanguageSettings(language) {
    if (language === 'fr') {
        // Apply French language settings
    } else {
        // Apply default language settings
    }
}




    // Only show modal if cookie consent hasn't been given
    console.log("Checking cookie consent status");
    if (!getCookie('cookieConsent')) {
        console.log("No cookie consent found, displaying modal");
        modal.style.display = 'block';
        bodyContent.classList.add('blur-background');
    }

    // Event listener for accept
    acceptBtn.addEventListener('click', function() {
        setCookie('cookieConsent', 'accepted', 30);
        modal.style.display = 'none';
        bodyContent.classList.remove('blur-background');
        // Load and apply language preference
        var userLanguage = getCookie('userLanguage')
        if (userLanguage) {
            // Apply the language setting
            applyLanguageSetting(userLanguage);
        }
    });

    // Event listener for decline
    declineBtn.addEventListener('click', function() {
        setCookie('cookieConsent', 'declined', 30);
        modal.style.display = 'none';
        bodyContent.classList.remove('blur-background');
        // Actions to take on decline
    });


document.addEventListener('DOMContentLoaded', function() {
    // Start the hangman game
    startGame();

    // Set up the cookie consent modal
    var modal = document.getElementById('cookie-consent-modal');
    var acceptBtn = document.getElementById('accept-cookies');
    var declineBtn = document.getElementById('decline-cookies');
    var bodyContent = document.querySelector('.main-content');

    // Check cookie consent status
    if (!getCookie('cookieConsent')) {
        modal.style.display = 'block';
        bodyContent.classList.add('blur-background');
    }

    // Event listeners for accept and decline buttons
    acceptBtn.addEventListener('click', function() {
        setCookie('cookieConsent', 'accepted', 30);
        modal.style.display = 'none';
        bodyContent.classList.remove('blur-background');
    });

    declineBtn.addEventListener('click', function() {
        setCookie('cookieConsent', 'declined', 30);
        modal.style.display = 'none';
        bodyContent.classList.remove('blur-background');
    });

    // Set up the random sentence generator form submission
    document.getElementById('random').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting in the traditional way
        generateRandomSentence(); // Call the function to generate and display the sentence
    });
});


