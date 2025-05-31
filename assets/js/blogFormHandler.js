// blogFormHandler.js
import { closeModalById } from './lookies.js';
import { db, auth } from './firebaseInit.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { getJwtFromFirestore } from './firebaseUtils.js';

function attachBlogPostListener(blogForm) {
    if (!blogForm.hasListener) {
        blogForm.addEventListener('submit', handleBlogPostSubmit);
        blogForm.hasListener = true;
        console.log("Blog post form listener attached");
    }
}

function executeRedirect(url) {
    console.log("executeRedirect called with URL:", url);
    
    // Simple redirect - no need for multiple fallbacks
    window.location.href = url;
}

async function handleBlogPostSubmit(event) {
    event.preventDefault();
    
    const title = event.target.querySelector('#blogTitle').value;
    const content = event.target.querySelector('#blogContent').value;
    console.log("Posting blog titled:", title);

    try {
        if (!db) {
            throw new Error("Firestore not initialized.");
        }

        await addDoc(collection(db, "blogPosts"), {
            title,
            content,
            timestamp: serverTimestamp()
        });

        console.log("Blog post successfully added to Firestore");
        closeModalById('auth-modal');

        // Use the stored JWT token from signup instead of fetching again
        const jwtToken = window.signupJwtToken;
        if (jwtToken) {
            console.log("Using stored JWT for redirect");
            const redirectUrl = `https://labase.languapps.com/?authToken=${encodeURIComponent(jwtToken)}`;
            executeRedirect(redirectUrl);
        } else {
            console.error("No stored JWT token found");
        }

    } catch (error) {
        console.error("Error adding blog post to Firestore:", error);
    }
}

// Function to handle Skip button click
function handleSkipButtonClick() {
    console.log("Skip button clicked");
    closeModalById('auth-modal');
    
    // Use the stored JWT token from signup
    const jwtToken = window.signupJwtToken;
    if (jwtToken) {
        console.log("Using stored JWT for skip redirect");
        const redirectUrl = `https://labase.languapps.com/?authToken=${encodeURIComponent(jwtToken)}`;
        executeRedirect(redirectUrl);
    } else {
        console.error("No stored JWT token found for skip");
    }
}

export { attachBlogPostListener, handleBlogPostSubmit, handleSkipButtonClick };