// games.js 0) global variables 1) game functions 2) gtag & Pixel 3) game variables 4) Utility Fuctions 
//_         __      __   _     _       _     _      __      ___      ___      __  
// |       /  \    |  \ | |   //  __  | |   | |    /  \    |   \    |   \    / _/
// |      / /\ \   | |\\| |  ((  |_ | | |   | |   / /\ \   | () )   | () )  ( (
// |__   /  __  \  | | \  |   \\__//  |  \_/  |  /  __  \  | __/    | __/   _) )
//____| /__/  \__\ |_|  \_|    \__/    \_____/  /__/  \__\ |_|      |_|     \__/
// Import getDocs and collection from Firestore SDK
// Import necessary Firebase functions from Firestore
import { getDocs, collection, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { db } from './firebaseInit.js';

// Section 0: Global Variables
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
const words = [
    "apple", "banana", "carrot", "date", "eggplant", "fig", "grape", "honeydew",
    "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry",
    "strawberry", "tomato", "ugli fruit", "watermelon", "zucchini", "yam", "xigua",
    "cucumber", "broccoli", "avocado", "bell pepper", "dragon fruit", "elderberry",
    "jicama", "kale", "lettuce", "mushroom", "olive", "peach", "pear", "radish",
    "spinach", "tangerine", "blueberry", "durian", "endive", "grapefruit", "jackfruit",
    "kiwano", "lime", "lychee", "okra"
];

// Section 1: Game Logic
function startGame() {
    wordToGuess = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    wrongGuesses = 0;
    wrongLetters = [];
    resetButtons();
    updateHangmanImage();
    displayWord();
}

function makeGuess(letter) {
    letter = letter.toLowerCase();
    const wordToGuessLower = wordToGuess.toLowerCase();

    if (wordToGuessLower.includes(letter)) {
        if (!guessedLetters.includes(letter)) {
            guessedLetters.push(letter);
            displayWord();
        }
    } else {
        if (!wrongLetters.includes(letter)) {
            wrongLetters.push(letter);
            wrongGuesses++;
            updateHangmanImage();
        }
    }
    disableButton(letter);
    checkGameOver();
}

function updateHangmanImage() {
    const imageElement = document.getElementById('hangman-image');
    if (imageElement) {
        const imageIndex = Math.min(wrongGuesses, hangmanImages.length - 1);
        imageElement.src = hangmanImages[imageIndex];
    } else {
        console.error("Hangman image element not found");
    }
}

function displayWord() {
    const wordDisplay = document.getElementById("word-display");
    wordDisplay.innerHTML = wordToGuess.split("").map(letter =>
        guessedLetters.includes(letter) ? letter : "_").join(" ");
}

function checkGameOver() {
    if (wordToGuess.split("").every(letter => guessedLetters.includes(letter))) {
        alert(`Congratulations! You guessed the word: ${wordToGuess}`);
        startGame();
    } else if (wrongGuesses >= hangmanImages.length - 1) {
        alert(`Game over! The word was: ${wordToGuess}`);
        startGame();
    }
}

// Utility: Reset buttons
function resetButtons() {
    document.querySelectorAll('#letter-buttons button').forEach(button => {
        button.classList.remove('guessed');
        button.disabled = false;
    });
}

function disableButton(letter) {
    const button = document.getElementById("button-" + letter);
    if (button) {
        button.classList.add('guessed');
        button.disabled = true;
    }
}

// Section 2: Random Sentence Generator
//function generateRandomSentence() {
//    const subjectPronouns = ['I', 'You', 'He', 'She', 'They'];
//    const objectPronouns = ['me', 'you', 'him', 'her', 'them'];
//    const determiners = ['the', 'a', 'my', 'your'];
//    const nouns = ['cat', 'dog', 'pizza', 'music', 'car'];
//
//    const verbs = {
//        base: ['love', 'convince', 'show', 'enjoy', 'dislike', 'prefer'],
//        thirdPersonSingular: ['loves', 'convinces', 'shows', 'enjoys', 'dislikes', 'prefers']
//    };
//
//    function getRandomElement(arr) {
//        return arr[Math.floor(Math.random() * arr.length)];
//    }
//
//    function isThirdPersonSingular(subject) {
//        return !['I', 'You', 'They'].includes(subject);
//    }
//
//    const subject = getRandomElement(subjectPronouns);
//    const verb = isThirdPersonSingular(subject) ? getRandomElement(verbs.thirdPersonSingular) : getRandomElement(verbs.base);
//    const object = getRandomElement(objectPronouns);
//
//    return `${subject} ${verb} ${object}.`;

//3.2 generateFortune

const templates = [
    "You will {action} {object} {time}",
    "An {adjective} {noun} has been {verbPastParticiple}.",
    "The {noun} {action} {adverb}.",
    "Expect {object} to {action} {time}.",
    "An {adjective} opportunity is coming your way.",
    "Your {noun} will {action} soon.",
    "Embrace the {noun} that {action}.",
    "An {adjective} journey awaits you {time}.",
    "The future {verb} {noun}.",
    "You are destined to {action} {object}."
]
const wordLists = {
    action: [
        "embrace",
        "discover",
        "achieve",
        "overcome",
        "pursue",
        "seek",
        "find",
        "nurture",
        "unlock",
        "cultivate"
    ],
    object: [
        "new opportunities",
        "hidden talents",
        "inner strength",
        "lasting relationships",
        "unforeseen challenges",
        "great success",
        "unexpected joys",
        "personal growth",
        "lasting happiness",
        "meaningful connections"
    ],
    time: [
        "soon",
        "in the near future",
        "unexpectedly",
        "before long",
        "in the coming months",
        "shortly",
        "in due time",
        "when you least expect it",
        "at this moment",
        "in the next phase of your life"
    ],
    adjective: [
        "honest",
        "unexpected",
        "earnest",
        "exciting",
        "amorphous",
        "inspiring",
        "unfolding",
        "exciting",
        "irascable"
    ],
    noun: [
        "opportunity",
        "journey",
        "challenge",
        "path",
        "adventure",
        "experience",
        "turning point",
        "moment",
        "chapter",
        "phase"
    ],
    verbPastParticiple: [
        "laid",
        "built",
        "established",
        "created",
        "designed",
        "implemented",
        "initiated",
        "crafted",
        "developed",
        "formed"
    ],
    adverb: [
        "steadily",
        "gradually",
        "quietly",
        "swiftly",
        "boldly",
        "gently",
        "confidently",
        "gracefully",
        "boldly",
        "quietly"
    ]
};
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function generateFortune() {
    const template = getRandomElement(templates);
    
    // Replace placeholders with random words/phrases
    const fortune = template
        .replace("{action}", getRandomElement(wordLists.action))
        .replace("{object}", getRandomElement(wordLists.object))
        .replace("{time}", getRandomElement(wordLists.time))
        .replace("{adjective}", getRandomElement(wordLists.adjective))
        .replace("{noun}", getRandomElement(wordLists.noun))
        .replace("{verbPastParticiple}", getRandomElement(wordLists.verbPastParticiple))
        .replace("{adverb}", getRandomElement(wordLists.adverb));
    
    return fortune;
}

// Section 3: Blog Post Loader
async function loadBlogPosts() {
    const blogSection = document.getElementById('blog-posts');
    if (!blogSection) return;

    try {
        const blogPostsQuery = query(collection(db, "blogPosts"), orderBy("timestamp", "desc"), limit(4));
        const querySnapshot = await getDocs(blogPostsQuery);
        
        blogSection.innerHTML = '';
        querySnapshot.forEach(doc => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('blog-post');
            postElement.innerHTML = `<h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.content)}</p>`;
            blogSection.appendChild(postElement);
        });
    } catch (error) {
        console.error("Error loading blog posts:", error);
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

// Section 4: Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    startGame();  
    loadBlogPosts();

    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    letters.forEach(letter => {
        const button = document.getElementById('button-' + letter);
        if (button) {
            button.addEventListener('click', () => makeGuess(letter));
        }
    });

    const randomSentenceForm = document.getElementById('random');
    if (randomSentenceForm) {
        randomSentenceForm.addEventListener('submit', event => {
            event.preventDefault();
            const randomSentence = generateFortune();
            document.getElementById('random-sentence').textContent = randomSentence;
        });
    }

    const fortuneButton = document.getElementById('Fortune');
    const fortuneDisplay = document.getElementById('fortune-display');
    if (fortuneButton && fortuneDisplay) {
        fortuneButton.addEventListener('click', () => {
            const fortune = generateRandomSentence();  // Changed to reuse the random sentence generator
            fortuneDisplay.textContent = fortune;
        });
    }
});
