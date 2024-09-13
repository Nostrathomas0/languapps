//assets/js/lookies.js
import { signUp } from './firebaseAuth.js';
import { auth } from './firebaseInit.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired");

    // Function to handle the transition between steps in modals
    function transitionModalStep(currentStepId, nextStepId) {
        const currentStep = document.getElementById(currentStepId);
        const nextStep = document.getElementById(nextStepId);

        if (currentStep && nextStep) {
            console.log(`Transitioning from ${currentStepId} to ${nextStepId}`);
            currentStep.style.display = 'none';
            nextStep.style.display = 'block';
        } else {
            console.error('Error transitioning steps: Step elements not found.');
        }
    }

    function openModalById(modalId, stepId) {
        console.log("Attempting to open modal", modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            console.log("Modal Found:", modalId);
            modal.style.display = 'block';
            if (stepId) {
                console.log("Attempting to show step", stepId);
                modal.querySelectorAll('.modal-step').forEach(step => {
                    step.style.display = 'none';
                });
                const step = document.getElementById(stepId);
                if (step) {
                    console.log("Step Found:", stepId);
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
        if (modal) {
            console.log("Closing modal", modalId);
            modal.style.display = 'none';
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    const openModalButton = document.getElementById('openModalButton');
    if (openModalButton) {
        console.log("openModalButton found");
        openModalButton.addEventListener('click', function() {
            console.log("openModalButton clicked");
            openModalById('auth-modal', 'step1');
        });
    } else {
        console.error('openModalButton not found');
    }

    document.querySelectorAll('.close').forEach(function(element) {
        element.addEventListener('click', function() {
            const modal = element.closest('.modal');
            if (modal) {
                const modalId = modal.id;
                console.log("Closing modal with class 'close'", modalId);
                closeModalById(modalId);
            } else {
                console.error('Modal not found for closing element');
            }
        });
    });

    function checkForModalOpening() {
        const urlParams = new URLSearchParams(window.location.search);
        const shouldOpenModal = urlParams.get('openModal');

        if (shouldOpenModal === 'true') {
            console.log("URL parameter indicates to open modal");
            openModalById('auth-modal', 'step1');
        }
    }

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

    function eraseCookie(name) {
        setCookie(name, "", -1);
    }

    async function applyLanguageSettings(language) {
        try {
            const response = await fetch(`assets/trans/${language}.json`);
            const translations = await response.json();

            document.querySelectorAll('[data-translate]').forEach(function (elem) {
                const key = elem.getAttribute('data-translate');
                if (translations[key]) {
                    elem.textContent = translations[key];
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
            acceptBtn.removeEventListener('click', handleAcceptClick);
            acceptBtn.addEventListener('click', handleAcceptClick);
        }

        if (declineBtn) {
            declineBtn.removeEventListener('click', handleDeclineClick);
            declineBtn.addEventListener('click', handleDeclineClick);
        }

        if (languageDropdown) {
            languageDropdown.removeEventListener('change', handleLanguageChange);
            languageDropdown.addEventListener('change', handleLanguageChange);
        }

        if (loginButton) {
            loginButton.removeEventListener('click', handleLoginClick);
            loginButton.addEventListener('click', handleLoginClick);
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
        console.log("Language preference set to:", language);
    }

    function handleLoginClick() {
        if (userIsAuthenticated()) {
            openModalById('alreadyLoggedInModal');
        } else {
            openModalById('auth-modal');
        }
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

    function handleBlogPostSubmit(event) {
        event.preventDefault();
        const title = event.target.querySelector('#blogTitle').value;
        const content = event.target.querySelector('#blogContent').value;
        console.log("Posting blog titled:", title);
        closeModalById('auth-modal');
    }

    function userIsAuthenticated() {
        // Updated to use Firebase auth check
        return !!auth.currentUser;
    }

    setupEventListeners();
    checkForModalOpening();
});
