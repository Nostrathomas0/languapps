import './firebaseInit.js'; //ensures Firebase is initialized
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from './firebaseInit.js';

// Form submission for adding blog posts
var addPostForm = document.getElementById('addBlogPostForm');
if (addPostForm) {
    addPostForm.addEventListener('submit', asych function(event) {
        event.preventDefault(); // Prevent the default form submission action

        // Retrieve the title and content from the form
        var title = document.getElementById('title').value;
        var content = document.getElementById('content').value;

        try {
            // Call the function to add the blog post to Firestore
            await addBlogPost(title, content, "Tom");
        
            // After a successful addition, load blog post to update them
            await loadBlogPosts();
        } catch (error) {
            console.error("Error adding post:", error);
        }
        
        // Optional: clear the form fields after submission
        addPostForm.reset();
    });
}

// Blog Functions
export async function addBlogPost(title, content, author) {
    try {
        const docRef = await addDoc(collection(window.db, "blogPosts"), {
            title,
            content,
            author,
            timestamp: serverTimestamp() // Server-side timestamp
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
export async function loadBlogPosts() {
    if (!window.db) {
        console.error('Firestone is not initialized yet');
        return;
    }
    
    const blogSection = document.getElementById('blog-posts');
    const querySnapshot = await getDocs(collection(window.db, "blogPosts")); // Use the modular syntax here
    querySnapshot.forEach((doc) => {
        const post = doc.data();
        const postElement = document.createElement('div');
        postElement.classList.add('blog-post');
        postElement.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
        blogSection.appendChild(postElement);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadBlogPosts();
});
