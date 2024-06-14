// ookies.js
import { auth } from './firebaseInit.js';  
import { signUp } from './authentication.js';

// Variables for UI elements
var userLanguage = getCookie('userLanguage') || 'en';
var modal = document.getElementById('cookie-consent-modal');
var bodyContent = document.querySelector('.main-content');
var languageDropdown = document.getElementById('language-dropdown');

// Utility functions for cookies and language settings


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
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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

function switchLanguage(lang) {
    document.querySelectorAll('[data-translate]').forEach(function (elem) {
        var key = elem.getAttribute('data-translate');
        if (translations[key] && translations[key][lang]) {
            elem.textContent = translations[key][lang];
        }
    });
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
}



function checkUserConsent() {
    var consentGiven = getCookie('userConsent');
    if (!consentGiven) {
        showModal();  // Trigger modal that asks for consent
    } else {
        applyLanguageSettings(userLanguage);  // Apply settings immediately if consented
    }
}

// Function to set up all event listeners, including consent and modal interactions
function setupEventListeners() {
    checkUserConsent();  // Check for user consent on load

    document.querySelectorAll('.close').forEach(element => {
        element.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModalById(modalId);
        });
    });

    // Setup for cookie consent buttons
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            setCookie('userConsent', 'accepted', 365);
            closeModalById('cookie-consent-modal');
            applyLanguageSettings(userLanguage);  // Apply language settings on consent
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', function() {
            setCookie('userConsent', 'declined', 365);
            closeModalById('cookie-consent-modal');
        });
    }

if (languageDropdown) {
    languageDropdown.addEventListener('change', function () {
        setLanguagePreference(this.value);
    });
}








document.getElementById("loginButton").addEventListener("click", function() {
    if (userIsAuthenticated()) {
        openModalById('alreadyLoggedInModal');
    } else {
        openModalById('auth-modal');
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
});

document.querySelectorAll('.close').forEach(element => {
    element.addEventListener('click', function() {
        const modalId = this.closest('.modal').id;
        closeModalById(modalId);
    });
});

if (acceptBtn) {
    acceptBtn.addEventListener('click', acceptCookies);
}

if (declineBtn) {
    declineBtn.addEventListener('click', declineCookies);
}

if (languageDropdown) {
    languageDropdown.addEventListener('change', function() {
        setLanguagePreference(this.value);
    });
}
}

// Initialize all scripts after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupEventListeners);

// Additional helper functions
function openModalById(modalId, stepId) {
const modal = document.getElementById(modalId);
if (modal) { 
    modal.style.display = 'block';
    if (stepId) {
        modal.querySelectorAll('.modal-step').forEach(step => {
            step.style.display = 'none';
        });
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = 'block';
        } else{
            console.error('Spec step not found:', stepId);
        }
    } 
} else {
    console.error('Modal not found:', modalID);
}}

function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';


function userIsAuthenticated() {
    // Implementation depends on how authentication status is determined
    // Dummy implementation:
    return !!auth.currentUser;
}}