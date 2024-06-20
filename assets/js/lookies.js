// ookies.js
import { auth } from './firebaseInit.js';  
import { signUp } from './authentication.js';

document.addEventListener('DOMContentLoaded', function() {
    function openModalById(modalId, stepId) {
        console.log("Attempting to open modal", modalId);
        const modal = document.getElementById(modalId);
        if (modal) { 
            console.log("Modal Found:", modalId);
            modal.style.display = 'block';
            if (stepId) {
                modal.querySelectorAll('.modal-step').forEach(step => {
                    step.style.display = 'none';
                });
                const step = document.getElementById(stepId);
                if (step) {
                    step.style.display = 'block';
                } else {
                    console.error('Specified step not found:', stepId);
                }
            } 
        } else {
            console.error('Modal not found:', modalId);
        }
    }
    
    function closeModalById(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }

    // Check if the button exists before adding the event listener
    const openModalButton = document.getElementById('openModalButton');
    if (openModalButton) {
        openModalButton.addEventListener('click', function() {
            openModalById('auth-modal', 'step1');
        });
    } else {
        console.error('openModalButton not found');
    }

    // Check if the elements with class 'close' exist before adding the event listeners
    document.querySelectorAll('.close').forEach(function(element) {
        element.addEventListener('click', function() {
            const modalId = element.closest('.modal').id;
            closeModalById(modalId);
        });
    });

    // Additional initialization if necessary
    checkForModalOpening();

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
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // Utility function to apply language settings asynchronously
    async function applyLanguageSettings(language) {
        try {
            // Fetch the translation file for the selected language
            const response = await fetch(`assets/trans/${language}.json`);
            const translations = await response.json();

            // Apply translations to all elements with the 'data-translate' attribute
            document.querySelectorAll('[data-translate]').forEach(function (elem) {
                const key = elem.getAttribute('data-translate');
                if (translations[key]) {
                    elem.textContent = translations[key];  // Using textContent for security
                }
            });
        } catch (error) {
            console.error('Error loading or applying translations:', error);
        }
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

    // Variables for UI elements
    var userLanguage = getCookie('userLanguage') || 'en';
    var modal = document.getElementById('cookie-consent-modal');
    var bodyContent = document.querySelector('.main-content');
    var languageDropdown = document.getElementById('language-dropdown');
});

// Utility functions for cookies and language settings


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
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        applyLanguageSettings('en'); // Default language set to English on page load
    });
    
    function setupEventListeners() {
        const acceptBtn = document.getElementById('accept-cookies');
        const declineBtn = document.getElementById('decline-cookies');
        const languageDropdown = document.getElementById('language-dropdown');
    
        // Event listener for accepting cookies
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                setCookie('userConsent', 'accepted', 365);
                closeModalById('cookie-consent-modal');
                applyLanguageSettings(getCookie('userLanguage') || 'en');  // Apply language settings based on user preference or default
            });
        } else {
            console.error('Accept button not found');
        }
    
        // Event listener for declining cookies
        if (declineBtn) {
            declineBtn.addEventListener('click', function() {
                setCookie('userConsent', 'declined', 365);
                closeModalById('cookie-consent-modal');
            });
        }
    
        // Event listener for language selection
        if (languageDropdown) {
            languageDropdown.addEventListener('change', function() {
                setLanguagePreference(this.value);
                applyLanguageSettings(this.value); // Apply language settings as soon as the user changes the language
            });
        }
    
        document.querySelectorAll('.close').forEach(element => {
            element.addEventListener('click', function() {
                const modalId = this.closest('.modal').id;
                closeModalById(modalId);
            });
        });
    }
    



    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
    });
    
    function setupEventListeners() {
        const loginButton = document.getElementById("loginButton");
        const signUpForm = document.getElementById('signupForm');
        const userDetailsForm = document.getElementById('userDetailsForm');
        const addBlogPostForm = document.getElementById('addBlogPostForm');
        const acceptBtn = document.getElementById('accept-cookies');
        const declineBtn = document.getElementById('decline-cookies');
        const languageDropdown = document.getElementById('language-dropdown');
    
        if (loginButton) {
            loginButton.addEventListener("click", function() {
                if (userIsAuthenticated()) {
                    openModalById('alreadyLoggedInModal');
                } else {
                    openModalById('auth-modal');
                }
            });
        }
    
        if (signUpForm) {
            signUpForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const email = this.querySelector('#signupEmail').value;
                const password = this.querySelector('#signupPassword').value; // Assuming password field exists
                signUp(email, password).then(() => {
                    console.log("Sending validation email to:", email);
                    transitionModalStep('step1', 'step2');
                }).catch(error => {
                    console.error("Error during sign-up:", error);
                });
            });
        }
    
        if (userDetailsForm) {
            userDetailsForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const userName = this.querySelector('#userName').value;
                const activationCode = this.querySelector('#activationCode').value;
                const password = this.querySelector('#choosePassword').value;
                console.log("Verifying details for:", userName, "with code:", activationCode);
                transitionModalStep('step2', 'step3');
            });
        }
    
        if (addBlogPostForm) {
            addBlogPostForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const title = this.querySelector('#blogTitle').value;
                const content = this.querySelector('#blogContent').value;
                console.log("Posting blog titled:", title);
                closeModalById('auth-modal');
            });
        }
    
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
        document.querySelectorAll('.close').forEach(element => {
            element.addEventListener('click', function() {
                const modalId = this.closest('.modal').id;
                closeModalById(modalId);
            });
        });
    
        
    }
    
    function userIsAuthenticated() {
        // Updated to use Firebase auth check
        return !!auth.currentUser;
    }
    

// Initialize all scripts after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupEventListeners);

// Additional helper functions

}