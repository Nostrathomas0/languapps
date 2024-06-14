// lookies.js
//_         __      __   _     _       _     _      __      ___      ___      __  
// |       /  \    |  \ | |   //  __  | |   | |    /  \    |   \    |   \    / _/
// |      / /\ \   | |\\| |  ((  |_ | | |   | |   / /\ \   | () )   | () )  ( (
// |__   /  __  \  | | \  |   \\__//  |  \_/  |  /  __  \  | __/    | __/   _) )
//____| /__/  \__\ |_|  \_|    \__/    \_____/  /__/  \__\ |_|      |_|     \__/

import { auth } from './firebaseInit.js';  
import { signUp } from './authentification.js';

var userLanguage = getCookie('userLanguage') || 'en';
var modal = document.getElementById('cookie-consent-modal');
var acceptBtn = document.getElementById('accept-cookies');
var declineBtn = document.getElementById('decline-cookies');
var bodyContent = document.querySelector('.main-content');
var languageDropdown = document.getElementById('language-dropdown');

// Function to open a specific modal by ID
   function openModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}


// Function to close a specific modal by ID
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}
// Cookie Consent Modal Handling
 function acceptCookies() {
     setCookie('userConsent', 'accepted', 365);
     closeModalById('cookie-consent-modal');
 }
 
 function declineCookies() {
     setCookie('userConsent', 'declined', 365);
     closeModalById('cookie-consent-modal');
 }
 
 function closeCookieModal() {
     modal.style.display = 'none';
     bodyContent.classList.remove('blur-background');
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
         currentStep.style.display = 'none';
         nextStep.style.display = 'block';
     } else {
         console.error('Error transitioning steps: Step elements not found.');
     }
 }

document.addEventListener('DOMContentLoaded', function () {
   checkUserConsent();
//
   document.querySelectorAll('.close').forEach(function (element) {
       element.addEventListener('click', function () {
           const modalId = element.parentElement.parentElement.id;
           closeModalById(modalId);
       });
   });
//
   if (acceptBtn) {
       acceptBtn.addEventListener('click', acceptCookies);
   }
//
   if (declineBtn) {
       declineBtn.addEventListener('click', declineCookies);
   }
//
   if (languageDropdown) {
       languageDropdown.addEventListener('change', function () {
           setLanguagePreference(this.value);
       });
   }
//
   // Check if the page should open a modal on load based on URL parameters
   checkForModalOpening();
});
// Additional functions like switchLanguage, applyLanguageSettings, setLanguagePreference, etc.
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
            elem.innerHTML = translations[key][language];
        }
    });
}

function setLanguagePreference(language) {
    setCookie('userLanguage', language, 365);
    applyLanguageSettings(language);
}

function openBlogFormModal() {
    console.log("Opening blog form modal");
    window.open('blog-form.html', 'BlogForm', 'width=600,height=400,resizable=no,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no').focus();
}

function checkForModalOpening() {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenModal = urlParams.get('openModal');

    if (shouldOpenModal === 'true') {
        openModalById('auth-modal');
    }

// Authentication handling function
document.getElementById("signinForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User created and signed in:", userCredential.user);
            closeModalById('auth-modal');
        })
        .catch((error) => {
            console.error("Error signing in:", error);
        });
});

// Event listeners for modal buttons
// This assumes that you want to check if the user is authenticated before deciding which modal to open
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});
    document.getElementById("loginButton").addEventListener("click", function() {
        if (userIsAuthenticated()) {
            // Assuming userIsAuthenticated() is a function that checks user's auth status
            openModalById('alreadyLoggedInModal'); // Opens a different modal or performs some action for logged-in users
        } else {
            openModalById('auth-modal'); // Opens the auth modal for non-authenticated users
        }
    });

document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    signUp(email).then(() => {
        console.log("Sending validation email to:", email);
        transitionModalStep('step1', 'step2');
    }).catch(error => {
        console.error("Error during sign-up:", error);
    });
});

document.getElementById('userDetailsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userName = document.getElementById('userName').value;
    const activationCode = document.getElementById('activationCode').value;
    const password = document.getElementById('choosePassword').value;
    console.log("Verifying details for:", userName, "with code:", activationCode);
    transitionModalStep('step2', 'step3');
});

document.getElementById('addBlogPostForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('blogTitle').value;
    const content = document.getElementById('blogContent').value;
    console.log("Posting blog titled:", title);
    closeModalById('auth-modal');
})
// Cookie Utility Functions
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
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


}}
