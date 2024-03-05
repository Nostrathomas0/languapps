import './firebaseInit.js';  // Ensures Firebase is initialized
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Form submission for adding blog posts
var addPostForm = document.getElementById('addBlogPostForm');
if (addPostForm) {
    addPostForm.addEventListener('submit', async function(event) {
        event.preventDefault();  // Prevent the default form submission action

        // Retrieve the title and content from the form
        var title = document.getElementById('title').value;
        var content = document.getElementById('content').value;

        try {
            // Call the function to add the blog post to Firestore
            await addBlogPost(title, content, "Tom");
        
            // After a successful addition, redirect to the index.html
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Error adding post:", error);
            // Optionally, display an error message to the user
        }
    });
}

// Blog Functions
export async function addBlogPost(title, content, author) {
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

