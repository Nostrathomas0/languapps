// games.js
import { app } from './firebaseInit.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Exporting necessary functions
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
export function switchLanguage(lang) { 
    document.querySelectorAll('[data-translate]').forEach(function(elem) {
        var key = elem.getAttribute('data-translate');
        if (translations[key] && translations[key][lang]) {
            elem.textContent = translations[key][lang];
        }
    });
 }
export function applyLanguageSettings(language) { 
    document.querySelectorAll('[data-translate]').forEach(function(elem) {
        var key = elem.getAttribute('data-translate');
        if (translations[key] && translations[key][language]) {
            elem.innerHTML = translations[key][language]; // Use innerHTML if including HTML tags in translations
        }
    });
 }
export function setLanguagePreference(language) { 
    setCookie('userLanguage', language, 30); // Store the language preference
    applyLanguageSettings(language); // Apply the language immediately
 }
export async function addBlogPost(title, content, author) {
    const db = getFirestore(app); // Get Firestore instance

    try {
        const docRef = await addDoc(collection(db, "blogPosts"), {
            title,
            content,
            author,
            timestamp: serverTimestamp() // Server-side timestamp
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
document.addEventListener('DOMContentLoaded', loadBlogPosts);
  
export async function loadBlogPosts() {
const blogSection = document.getElementById('blog-posts');
    const querySnapshot = await window.db.collection("blogPosts").get();
    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const postElement = document.createElement('div');
      postElement.classList.add('blog-post');
      postElement.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
      blogSection.appendChild(postElement);
    });
}

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

// Section 1/2
// Language Toggle
var translations = {
    statement: {
        fr: "Apprenez des langues pour ouvrir des portes, rencontrer des gens, réussir et planifier votre avenir. Jouez à ce jeu en classe pour vous motiver. Astuce : mots anglais pour les fruits et légumes.",
        zh: "学习语言可以打开大门、结识新朋友、找到成功并规划您的未来。 玩这个课堂游戏可以激发动力。 <br>提示：水果和蔬菜的英语单词。"
    },
    does: {
        fr: "Édition numérique<br>Logiciel de révision<br>Diffusion en direct<br>Indépendant<br>Concours d'écriture<br>Spectacles de marionnettes<br>Phrases aléatoires !",
        zh: "数字出版<br>评论软件<br>直播<br>独立<br>写作比赛<br>木偶剧<br>随机英语句子！"
    },
    is: {
        fr: "professeur d'anglais, développeur web et linguiste appliqué. L'apprentissage des langues est notre première habitude et je veux aider les gens à retrouver leur sensibilité de jeunesse en ligne grâce à une immersion culturelle.",
        zh: "英语教师、网络开发人员和应用语言学家。 语言学习是我们的第一个习惯，我想通过文化沉浸帮助人们在网上找到他们年轻时对语言的敏感度。"
    }


    // Add more translations here
};





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






document.addEventListener('DOMContentLoaded', function() {
    
// Start the hangman game
startGame();
// Blog load 
loadBlogPosts();
// Set up the cookie consent modal
var modal = document.getElementById('cookie-consent-modal');
var acceptBtn = document.getElementById('accept-cookies');
var declineBtn = document.getElementById('decline-cookies');
var bodyContent = document.querySelector('.main-content');
var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var userLanguage = getCookie('userLanguage')
var languageDropdown = document.getElementById('language-dropdown');
var hamburger = document.querySelector('.hamburger-menu');
var navUL = document.querySelector('nav ul');
var startGameButton = document.getElementById('start-game');
// Form submission for adding blog posts
var addPostForm = document.getElementById('addBlogPostForm');
if (addPostForm) {
    addPostForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission action

        // Retrieve the title and content from the form
        var title = document.getElementById('title').value;
        var content = document.getElementById('content').value;

        // Call the function to add the blog post to Firestore
        addBlogPost(title, content, "Author Name"); // Replace "Author Name" with your actual name or a dynamic author name if you have one

        // Optional: clear the form fields after submission
        addPostForm.reset();
    });
}

// Only show modal if cookie consent hasn't been given
console.log("Checking cookie consent status");
if (!getCookie('cookieConsent')) {
    console.log("No cookie consent found, displaying modal");
    modal.style.display = 'block';
    bodyContent.classList.add('blur-background');
}

// Event listeners for accept and decline buttons
acceptBtn.addEventListener('click', function() {
    setCookie('cookieConsent', 'accepted', 30);
    modal.style.display = 'none';
    bodyContent.classList.remove('blur-background');
    if (userLanguage) {
        // Apply the langage settings
        applyLanguageSettings(userLanguage);
    }
});

declineBtn.addEventListener('click', function() {
    setCookie('cookieConsent', 'declined', 30);
    modal.style.display = 'none';
    bodyContent.classList.remove('blur-background');
});

if (languageDropdown) {
    languageDropdown.addEventListener('change', function() {
        setLanguagePreference(this.value);
    });
}
hamburger.addEventListener('click', function() {
    navUL.classList.toggle('active');
});

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

$(document).ready(function() {
    $('#hamburger-toggle').click(function() {
        $('#navigation').toggleClass('active');
    });
});