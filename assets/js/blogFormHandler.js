// blogFormHandler.js
import './firebaseInit.js';  // Ensures Firebase is initialized
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
// Form submission for adding blog posts from the auth modal
var addPostForm = document.getElementById('addBlogPostForm');
if (addPostForm) {
    addPostForm.addEventListener('submit', async function(event) {
        event.preventDefault();  // Prevent the default form submission action

        // Retrieve the title and content from the form in the auth modal
        var title = document.getElementById('blogTitle').value;
        var content = document.getElementById('blogContent').value;

        try {
            // Call the function to add the blog post to Firestore
            await addBlogPost(title, content, "Tom");

            // After successful submission, print the blog post to the index.html
            printBlogPostToIndex(title, content);
            
            // Optionally close the modal after submission
            closeModal();  // Assuming you have a function to close the modal
        } catch (error) {
            console.error("Error adding post:", error);
            // Optionally, display an error message to the user
        }
    });
}

// Function to add the blog post to Firestore
async function addBlogPost(title, content, author) {
    console.log("addBlogPost function called with:", title, content, author); // Add this log
    try {
        const docRef = await addDoc(collection(window.db, "blogPosts"), {
            title,
            content,
            author,
            timestamp: serverTimestamp()  // Server-side timestamp
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
// Function to print the blog post on index.html dynamically
function printBlogPostToIndex(title, content) {
    const blogSection = document.getElementById('blog-posts');  // Assuming you have this on index.html

    if (blogSection) {
        // Create a new blog post element
        const postElement = document.createElement('div');
        postElement.classList.add('blog-post');
        postElement.innerHTML = `
            <h3>${escapeHTML(title)}</h3>
            <p>${escapeHTML(content)}</p>
        `;

        // Append the new post to the blog section
        blogSection.prepend(postElement);  // Prepend to show the new post at the top
    }
}

// Helper function to escape HTML to prevent XSS attacks
function escapeHTML(string) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(string));
    return div.innerHTML;
}

// Function to close the modal (optional)
function closeModal() {
    const modal = document.getElementById('authModal');  // Assuming your modal has this ID
    if (modal) {
        modal.style.display = 'none';  // Hide the modal after submission
    }
}

// document.addEventListener('DOMContentLoaded', async function() {
    // Explicitly check for the existence of 'blog-posts' element before proceeding
//    if (document.getElementById('blog-posts')) {
//        try {
//            await loadBlogPosts();  // Load blog posts when DOM is fully loaded
 //       } catch (error) {
 //           console.error("Error loading blog posts:", error);
//        }
//    }
//});

