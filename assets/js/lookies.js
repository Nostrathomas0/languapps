// lookies.js
//_         __      __   _     _       _     _      __      ___      ___      __  
// |       /  \    |  \ | |   //  __  | |   | |    /  \    |   \    |   \    / _/
// |      / /\ \   | |\\| |  ((  |_ | | |   | |   / /\ \   | () )   | () )  ( (
// |__   /  __  \  | | \  |   \\__//  |  \_/  |  /  __  \  | __/    | __/   _) )
//____| /__/  \__\ |_|  \_|    \__/    \_____/  /__/  \__\ |_|      |_|     \__/

import { auth } from './firebaseInit.js';  // Assuming firebaseInit.js correctly exports an initialized 'auth' object
import { signUp } from './authentification.js';
// Global Variables and Initial set up
var userLanguage = getCookie('userLanguage') || 'en'; // Default to English if no cookie found
var modal = document.getElementById('cookie-consent-modal');
var acceptBtn = document.getElementById('accept-cookies');
var declineBtn = document.getElementById('decline-cookies');
var bodyContent = document.querySelector('.main-content');
var languageDropdown = document.getElementById('language-dropdown');


// Function to open a specific modal by ID
function openModalById(modalId) {
    const modal = document.getElementById(modalId);
    console.log('Modal opened')
    if (modal) modal.style.display = 'block';
}
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Cookie Consent Modal Handling
function acceptCookies() {
    setCookie('userConsent', 'accepted', 365); // Set consent cookie for 1 year
    closeModalById('cookie-consent-modal'); // Use a function to handle modal close for consistency
    // Any additional logic needed after consent
}

function declineCookies() {
    setCookie('userConsent', 'declined', 365); // Set decline cookie for 1 year
    closeModalById(cookie-consent-modal); // Use the same function to close modal for consistency
    // Any additional logic needed after declining
}

function closeCookieModal() {
    modal.style.display = 'none'; // Hide the modal
    bodyContent.classList.remove('blur-background'); // Remove blur from main content
}

function checkUserConsent() {
    var consentGiven = getCookie('userConsent');
    if (!consentGiven) {
        showModal();
    } else {
        applyLanguageSettings(userLanguage);
    }
}

function showModal() {
    modal.style.display = 'block';
    bodyContent.classList.add('blur-background');
}

function transitionModalStep(currentStepId, nextStepId) {
    const currentStep = document.getElementById(currentStepId);
    const nextStep = document.getElementById(nextStepId);
    if (currentStep && nextStep) {
        currentStep.style.display = 'none';  // Hide current step
        nextStep.style.display = 'block';    // Show next step
    } else {
        console.error('Error transitioning steps: Step elements not found.');
    }
}



// Event Listeners
document.addEventListener('DOMContentLoaded', checkUserConsent);

if (acceptBtn) {
    acceptBtn.addEventListener('click', acceptCookies);
}

if (declineBtn) {
    declineBtn.addEventListener('click', declineCookies);
}

if (languageDropdown) {
    languageDropdown.addEventListener('change', function () {
        setLanguagePreference(this.value);
    });
}
// Language Toggle Functions
function switchLanguage(lang) {
    document.querySelectorAll('[data-translate]').forEach(function (elem) {
        var key = elem.getAttribute('data-translate');
        if (translations[key] && translations[key][lang]) {
            elem.textContent = translations[key][lang];
        }
    });
}

function applyLanguageSettings(language) {
    document.querySelectorAll('[data-translate]').forEach(function (elem) {
        var key = elem.getAttribute('data-translate');
        if (translations[key] && translations[key][language]) {
            elem.innerHTML = translations[key][language]; // Use innerHTML if including HTML tags in translations
        }
    });
}

function setLanguagePreference(language) {
    setCookie('userLanguage', language, 365); // Store the language preference
    applyLanguageSettings(language); // Apply the language immediately
}

// Open the auth modal 
function openBlogFormModal() {
    console.log("Opening blog form modal");
    window.open('blog-form.html', 'BlogForm', 'width=600,height=400,resizable=no,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no');

    // Optional: Focus on the new window to bring it to the front
    modalWindow.focus();
}

// Check if the page should open a modal on load based on URL parameters
function checkForModalOpening() {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenModal = urlParams.get('openModal');

    if (shouldOpenModal === 'true') {
        openModalById('auth-modal'); // Make sure this function targets the correct modal ID
    }
}

// Function to handle user sign-up or login from the modal
function handleAuthFormSubmit(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    // Assuming a simple check or a way to differentiate between login and signup
    const isLogin = document.getElementById("auth-modal").classList.contains("login");

    if (isLogin) {
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User signed in:", userCredential.user);
            closeModal(); // Assuming closeModal() hides the auth modal
        })
        .catch((error) => {
            console.error("Error signing in:", error);
            alert("Login failed: " + error.message);  // Show error to the user
        });
    } else {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User registered and signed in:", userCredential.user);
            closeModal(); // Assuming closeModal() hides the auth modal
        })
        .catch((error) => {
            console.error("Error during sign-up:", error);
            alert("Signup failed: " + error.message);  // Show error to the user
        });
    }
}


// Cookie Utility Functions
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Set SameSite=Lax for general use, add Secure if setting SameSite=None
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


// Translations Object
var translations = {
    statement: {
        en: "Play hangman <br> Guess a letter to solve the puzzle <br> Hint: Fruits & Vegetables",
        fr: "Jouez au Pendu en anglais <br> Devinez les lettres à résoudre <br> Indice: fruits et légumes",
        zh: "用英语玩刽子手<br>猜字母来解决<br>提示: 水果和蔬菜。"
    },
    does: {
        en: "Social Connection<br>Publishing<br>Language Learning Streams<br>Contests<br>Puppet Shows<br>Games<br>Chat",
        fr: "Connexion sociale<br>Édition<br>Flux d'apprentissage des langues<br>Concours<br>Spectacles de marionnettes<br>Jeux<br>Bavarder pour pratique les langues",
        zh: "社交联系<br>出版<br>语言学习流<br>竞赛<br>木偶戏<br>游戏<br>聊天练习语言"
    },
    is: {
        en: "an English teacher, web developer and applied linguist. Language learning is our first habit and I want to help people find their youthful sensitivity to it online with cultural immersion.",
        fr: "professeur d'anglais, développeur web et linguiste appliqué. L'apprentissage des langues est notre première habitude et je veux aider les gens à retrouver leur sensibilité de jeunesse en ligne grâce à une immersion culturelle.",
        zh: "英语教师、网络开发人员和应用语言学家。 语言学习是我们的第一个习惯，我想通过文化沉浸帮助人们在网上找到他们年轻时对语言的敏感度。"
    }
    // Add more translations as needed
};


// Function to open the modal
function openModal() {
    document.getElementById("auth-modal").style.display = "block";
  }
  
  // Function to close the modal
  document.getElementsByClassName("close")[0].onclick = function() {
    document.getElementById("auth-modal").style.display = "none";
  }

document.getElementById("signinForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        console.log("User created and signed in:", userCredential.user);
        // You might want to close the modal here or show a success message
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        // Handle errors here, such as displaying a message in the modal
      });
  });

  
  // Event listeners to open modal buttons
document.getElementById("loginButton").addEventListener("click", openModal);
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    
    signUp(email).then(() => {
        console.log("Sending validation email to:", email);
        transitionModalStep('step1', 'step2');
    }).catch(error => {
        console.error("Error during sign-up:", error)
    });
    
});

document.getElementById('userDetailsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userName = document.getElementById('userName').value;
    const activationCode = document.getElementById('activationCode').value;
    const password = document.getElementById('choosePassword').value;
    console.log("Verifying details for:", userName, "with code:", activationCode);
    // Assume function to verify code and handle success
    transitionModalStep('step2', 'step3'); // Transition to blog post step
});

document.getElementById('addBlogPostForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('blogTitle').value;
    const content = document.getElementById('blogContent').value;
    console.log("Posting blog titled:", title);
    // Assume function to submit blog post and handle success
    closeModalById('auth-modal'); // Close the modal after posting
});
document.addEventListener('DOMContentLoaded', function () {
    checkForModalOpening();
});
document.getElementById('loginButton').addEventListener('click', function() {
    openModalById('auth-modal'); // Opens the modal with the ID 'auth-modal'
});

