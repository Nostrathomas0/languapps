//assets/js/lookies.js
import { signUp } from './firebaseAuth.js';
import { auth } from './firebaseInit.js';
import { attachBlogPostListener, handleBlogPostSubmit } from './blogFormHandler.js';  // Adjust the path as needed
// Utility Functions for Modals & Their Event Listeners
console.log("Lookies loaded");

function showModalStep(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
        document.querySelectorAll('.modal-step').forEach(step => {
            step.style.display = 'none';  // Hide all steps
        });
        step.style.display = 'block';  // Show the specified step
        console.log(`Step with ID ${stepId} is now visible.`);
    } else {
        console.error('Step not found:', stepId);
    }
}

// --- Function to Open a Modal by ID ---
function openModalById(modalId, stepId = null) {
    // Honeypot check
    const honeypot = document.getElementById('username');
    if (honeypot && honeypot.value !== '') {
        console.log("Honeypot field is filled, blocking access.");
        return; // Stop the function if the honeypot is filled
    }

    const url = new URL(window.location);
    url.searchParams.set('openModal', modalId);
    window.history.pushState({}, '', url);

    console.log("Attempting to open modal:", modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';  // Open the modal
        console.log(`Modal with ID ${modalId} is now open.`);
        if (stepId) {
            showModalStep(stepId);
        }
        const blogForm = document.getElementById('addBlogPostForm');
        if (blogForm && !blogForm.hasListener) {
            attachBlogPostListener(blogForm);
            blogForm.hasListener = true;
            console.log("Blog post listener attached.");
        }
    } else {
        console.error(`Modal with ID ${modalId} not found.`);
    }
};

// Utility function for closing modals based on modal ID
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        console.log(`Closed modal with ID: ${modalId}`);
    } else {
        console.error(`Modal with ID ${modalId} not found.`);
    }
};

// Attach click event to close buttons inside each modal
document.querySelectorAll('.close').forEach(function(element) {
    element.addEventListener('click', function() {
        const modal = element.closest('.modal'); // Find closest modal container
        if (modal) {
            closeModalById(modal.id); // Use modal ID to close it
        } else {
            console.error('No modal container found for close button.');
        }
    });
});

// --- Function to Transition Between Modal Steps ---
function transitionModalStep(currentStepId, nextStepId) {
    const currentStep = document.getElementById(currentStepId);
    const nextStep = document.getElementById(nextStepId);

    if (currentStep && nextStep) {
        currentStep.style.display = 'none';
        nextStep.style.display = 'block';
        console.log(`Transitioned from step ${currentStepId} to ${nextStepId}`);
    } else {
        console.error("Modal step elements not found.");
    }
}

// --- Event Listener for 'Open Modal' Button ---
const openModalButton = document.getElementById('openModalButton');
if (openModalButton) {
    console.log("Open modal button found");
    openModalButton.addEventListener('click', () => {
        console.log("Open modal button clicked");
        openModalById('auth-modal', 'step1');
    });
} else {
    console.error("Open modal button not found.");
}

// --- Check for URL parameter to open a modal on page load ---
function checkForModalOpening() {
    const urlParams = new URLSearchParams(window.location.search);
    const modalToOpen = urlParams.get('openModal');

    if (modalToOpen === 'auth') {
        console.log("URL parameter indicates opening the auth modal");
        openModalById('auth-modal', 'step1');
    } else {
        console.log(`URL parameter openModal=${modalToOpen} not recognized.`);
    }
}


// Ensure modal opening is checked on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    checkForModalOpening();
});

// Cookie Consent, Language Translation & Preference Settings
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function setLanguagePreference(language) {
    setCookie('userLanguage', language, 365);
    applyLanguageSettings(language);
}

async function applyLanguageSettings(language) {
    try {
        const response = await fetch(`assets/trans/${language}.json`);
        const translations = await response.json();

        document.querySelectorAll('[data-translate]').forEach(function(elem) {
            const key = elem.getAttribute('data-translate');
            if (translations[key]) {
                elem.textContent = translations[key];
            }
        });
    } catch (error) {
        console.error('Error loading or applying translations:', error);
    }
}
function checkUserConsent() {
    const consentGiven = getCookie('userConsent');
    if (!consentGiven) {
        console.log("User consent not found, showing consent modal");
        openModalById('cookie-consent-modal');
    } else {
        console.log("User consent found");
    }
}    
function setupEventListeners() {
    checkUserConsent();
    
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');
    const languageDropdown = document.getElementById('language-dropdown');
    const loginButton = document.getElementById("loginButton");
    const signUpForm = document.getElementById('signupForm');
    const userDetailsForm = document.getElementById('userDetailsForm');
    const addBlogPostForm = document.getElementById('addBlogPostForm');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', handleAcceptClick);
    }

    if (declineBtn) { 
        declineBtn.addEventListener('click', handleDeclineClick);
    }

    if (languageDropdown) {
        languageDropdown.addEventListener('change', handleLanguageChange);
    }
    
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login Button Clicked');
            openModalById('auth-modal', 'step1');
        });
    }

    if (signUpForm) {
        // Remove previous listener before adding a new one
        signUpForm.removeEventListener('submit', handleSignUp);
        signUpForm.addEventListener('submit', handleSignUp);
    }

    if (userDetailsForm) {
        userDetailsForm.removeEventListener('submit', handleUserDetails);
        userDetailsForm.addEventListener('submit', handleUserDetails);
    }

    if (addBlogPostForm) {
        addBlogPostForm.removeEventListener('submit', handleBlogPostSubmit);
        addBlogPostForm.addEventListener('submit', handleBlogPostSubmit);
    }
}


// Cookie functions 

function eraseCookie(name) {
    setCookie(name, "", -1);
}
function acceptCookies() {
    setCookie('userConsent', 'accepted', 365);
    closeModalById('cookie-consent-modal');
}

function declineCookies() {
    setCookie('userConsent', 'declined', 365);
    closeModalById('cookie-consent-modal');
}
// Function handlers to manage events
function handleAcceptClick() {
    setCookie('userConsent', 'accepted', 365);
    closeModalById('cookie-consent-modal');
}
function handleDeclineClick() {
    setCookie('userConsent', 'declined', 365);
    closeModalById('cookie-consent-modal');
}
function handleLanguageChange(event) {
    const language = event.target.value;
    setLanguagePreference(language);
    console.log("Language preference set to:", language);b
}

function handleSignUp(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true; // Prevent double submission

    const email = event.target.querySelector('#signupEmail').value;
    const password = event.target.querySelector('#signupPassword').value;

    signUp(email, password).then(() => {
        console.log("Sending validation email to:", email);
        transitionModalStep('step1', 'step2');
    }).catch(error => {
        console.error("Error during sign-up:", error);
        submitButton.disabled = false; // Re-enable if error occurs
    });
}
function handleUserDetails(event) {
    event.preventDefault();
    const userName = event.target.querySelector('#userName').value;
    const activationCode = event.target.querySelector('#activationCode').value;
    const password = event.target.querySelector('#choosePassword').value;
    console.log("Verifying details for:", userName, "with code:", activationCode);
    transitionModalStep('step2', 'step3');
}

// Function to toggle password visibility
function togglePasswordVisibility() {
    const signupPasswordInput = document.getElementById('signupPassword');
    const loginPasswordInput = document.getElementById('loginPassword');
    const showPasswordButton = document.getElementById('showPassword');

    if (showPasswordButton) {
        if (signupPasswordInput && signupPasswordInput.type === 'password') {
            signupPasswordInput.type = 'text';
            showPasswordButton.textContent = 'Hide Password';
        } else if (signupPasswordInput) {
            signupPasswordInput.type = 'password';
            showPasswordButton.textContent = 'Show Password';
        }
        
        if (loginPasswordInput && loginPasswordInput.type === 'password') {
            loginPasswordInput.type = 'text';
        } else if (loginPasswordInput) {
            loginPasswordInput.type = 'password';
        }
    }
}

// Attach click event to show password button if it exists
document.addEventListener('DOMContentLoaded', () => {
    const showPasswordButton = document.getElementById('showPassword');
    if (showPasswordButton) {
        showPasswordButton.addEventListener('click', togglePasswordVisibility);
    }
});
function userIsAuthenticated() {
    return !!auth.currentUser;
};

setupEventListeners();
checkForModalOpening();
       
export { closeModalById, openModalById, showModalStep, transitionModalStep, userIsAuthenticated };
