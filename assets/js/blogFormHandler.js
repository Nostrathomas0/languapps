// blogFormHandler.js
import { closeModalById } from './lookies.js';  // Adjust the path as necessary
import { db, auth } from './firebaseInit.js';  // Ensures Firebase is initialized
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { getJwtFromFirestore } from './firebaseUtils.js';

function attachBlogPostListener(blogForm) {
    // Make sure the listener is not attached multiple times
    if (!blogForm.hasListener) {
        blogForm.addEventListener('submit', handleBlogPostSubmit);  // Attach listener
        blogForm.hasListener = true;  // Mark that the listener has been added
        console.log("Blog post form listener attached");
    }
}

function executeRedirect(url) {
    console.log("executeRedirect called with URL:", url);
    // function to check if we're still in the same origin
    const checkIfRedirected = () => {
      return window.location.href.indexOf(new URL(url).origin) !== -1;
    };
  
    // Method 1: Standard location change
    window.location.href = url;
      
    // Set up fallback methods with increasing delays
    setTimeout(() => {
      if (!checkIfRedirected()) {
        console.log("Attempting fallback redirect method...");
        window.location.replace(url);
      }
    }, 200);
  
    setTimeout(() => {
      if (!checkIfRedirected()) {
        console.log("Attempting programmatic link click...");
        const link = document.createElement('a');
        link.href = url;
        link.style.display = 'none';
        link.setAttribute('target', '_self');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 500);
  
    setTimeout(() => {
      if (!checkIfRedirected()) {
        console.log("Final redirect attempt with user notification");
        alert("Redirecting you to La Base. Please click OK to continue.");
        window.location.href = url;
      }
    }, 1000);
}

async function handleBlogPostSubmit(event) {
    event.preventDefault();
    
    const title = event.target.querySelector('#blogTitle').value;
    const content = event.target.querySelector('#blogContent').value;
    console.log("Posting blog titled:", title);  // This is the log you're seeing

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

        // Add log to check if closeModalById is being called
        console.log("Calling closeModalById for auth-modal");
        closeModalById('auth-modal');

        // Use stored JWT token from signup if available, otherwise fetch from Firestore
        let jwtToken = window.signupJwtToken;
        
        if (!jwtToken && auth.currentUser) {
            const userId = auth.currentUser.uid;
            try {
                jwtToken = await getJwtFromFirestore(userId);
                console.log("JWT retrieved from Firestore for redirect:", jwtToken);
            } catch (tokenError) {
                console.error("Error retrieving token:", tokenError);
            }
        }

        if (jwtToken) {
            console.log("JWT token found for redirect");
            const subdomain = "https://labase.languapps.com";
            const redirectUrl = `${subdomain}/?authToken=${encodeURIComponent(jwtToken)}`;

            // Execute redirect
            executeRedirect(redirectUrl);
        } else {
            console.error("No JWT token found for redirect");
        }

    } catch (error) {
        console.error("Error adding blog post to Firestore:", error);
    }
}

// Function to handle Skip button click
function handleSkipButtonClick() {
    console.log("Skip button clicked");
    
    // Close the modal
    closeModalById('auth-modal');
    
    // Use stored JWT token from signup if available, otherwise fetch from Firestore
    let jwtToken = window.signupJwtToken;
    
    if (!jwtToken && auth.currentUser) {
        const userId = auth.currentUser.uid;
        
        getJwtFromFirestore(userId)
            .then(jwtToken => {
                if (jwtToken) {
                    console.log("JWT token retrieved for redirect:", jwtToken);
                    const subdomain = "https://labase.languapps.com";
                    const redirectUrl = `${subdomain}/?authToken=${encodeURIComponent(jwtToken)}`;
                    
                    // Execute the redirect
                    executeRedirect(redirectUrl);
                } else {
                    console.error("No JWT token found for user:", userId);
                }
            })
            .catch(error => {
                console.error("Error retrieving JWT token:", error);
            });
    } else if (jwtToken) {
        // Use stored token directly
        console.log("Using stored JWT for skip redirect");
        const subdomain = "https://labase.languapps.com";
        const redirectUrl = `${subdomain}/?authToken=${encodeURIComponent(jwtToken)}`;
        executeRedirect(redirectUrl);
    } else {
        console.error("No authenticated user found for redirect");
    }
}

// Helper function to escape HTML to prevent XSS attacks
function escapeHTML(string) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(string));
    return div.innerHTML;
}

// Function to print the blog post on index.html dynamically
//function printBlogPostToIndex(title, content) {
//    const blogSection = document.getElementById('blog-posts');  // Assuming you have this on index.html
// 
//    if (blogSection) {
//        // Create a new blog post element
//        const postElement = document.createElement('div');
//        postElement.classList.add('blog-post');
//        postElement.innerHTML = `
//            <h3>${escapeHTML(title)}</h3>
//            <p>${escapeHTML(content)}</p>
//        `;
// 
//        // Append the new post to the blog section
//        blogSection.prepend(postElement);  // Prepend to show the new post at the top
//    }

export { attachBlogPostListener, handleBlogPostSubmit, handleSkipButtonClick };