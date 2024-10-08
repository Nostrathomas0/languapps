//assets/js/lookies.js
import { signUp } from './firebaseAuth.js';
import { auth } from './firebaseInit.js';
import { attachBlogPostListener, handleBlogPostSubmit } from './blogFormHandler.js';  // Adjust the path as needed

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired");
    
    // Utility functions for modals
    function openModalById(modalId, stepId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';  // Open the modal
            console.log(`Modal with ID ${modalId} is now open.`);
            if (stepId) {
                showModalStep(stepId);  // Show the specific step
            }
            // After opening the modal, check if the blog post form is present
            const blogForm = document.getElementById('addBlogPostForm');
            if (blogForm) {
                attachBlogPostListener(blogForm);  // Attach listener to the blog post form
            }
        } else {
            console.error(`Modal with ID ${modalId} not found.`);
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
    
    // Function to handle the transition between steps in modals
    function transitionModalStep(currentStepId, nextStepId) {
        const currentStep = document.getElementById(currentStepId);
        const nextStep = document.getElementById(nextStepId);

        if (currentStep && nextStep) {
            currentStep.style.display = 'none';
            nextStep.style.display = 'block';
        } else {
            console.error('Blog form not found.');
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

//    function eraseCookie(name) {
//        setCookie(name, "", -1);
//    }

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

//    function acceptCookies() {
//        setCookie('userConsent', 'accepted', 365);
//        closeModalById('cookie-consent-modal');
//    }

//    function declineCookies() {
//        setCookie('userConsent', 'declined', 365);
//        closeModalById('cookie-consent-modal');
//    }

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
            loginButton.addEventListener('click', handleLoginClick);
        }
       
        
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


    function userIsAuthenticated() {
        // Updated to use Firebase auth check
        return !!auth.currentUser;
    }

    setupEventListeners();
    checkForModalOpening();
});
