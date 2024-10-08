// blogFormHandler.js
import { db } from './firebaseInit.js';  // Ensures Firebase is initialized
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

function attachBlogPostListener(blogForm) {
    // Make sure the listener is not attached multiple times
    if (!blogForm.hasListener) {
        blogForm.addEventListener('submit', handleBlogPostSubmit);  // Attach listener
        blogForm.hasListener = true;  // Mark that the listener has been added
        console.log("Blog post form listener attached");
    }
}


async function handleBlogPostSubmit(event) {
    event.preventDefault();
    
    const title = event.target.querySelector('#blogTitle').value;
    const content = event.target.querySelector('#blogContent').value;
    console.log("Posting blog titled:", title);  // This is the log you're seeing
    try {
        //
        if (!db) {
            throw new Error("Firestore not initialized.");
        }
        // Here the Firestore write should happen
        await addDoc(collection(db, "blogPosts"), {
            title,
            content,
            timestamp: serverTimestamp()
        });
       
        console.log("Blog post successfully added to Firestore");
    } catch (error) {
        console.error("Error adding blog post to Firestore:", error);
    }
    closeModalById('auth-modal');
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
// 

// Helper function to escape HTML to prevent XSS attacks
function escapeHTML(string) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(string));
    return div.innerHTML;
}
export { attachBlogPostListener, handleBlogPostSubmit };