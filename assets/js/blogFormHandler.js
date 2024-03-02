
import './firebaseInit.js';  // Ensures Firebase is initialized
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Form submission for adding blog posts
var addPostForm = document.getElementById('addBlogPostForm');
if (addPostForm) {
    addPostForm.addEventListener('submit', async function(event) {  // Corrected typo here
        event.preventDefault();  // Prevent the default form submission action

        // Retrieve the title and content from the form
        var title = document.getElementById('title').value;
        var content = document.getElementById('content').value;

        try {
            // Call the function to add the blog post to Firestore
            await addBlogPost(title, content, "Tom");
        
            // After a successful addition, load blog posts to update them
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
            timestamp: serverTimestamp()  // Server-side timestamp
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

export async function loadBlogPosts() {
    const blogSection = document.getElementById('blog-posts');

    // Check if blogSection exists before proceeding
    if (!blogSection) {
        console.error("Error loading blog posts: blogSection element not found");
        return; // Exit the function if blogSection is not found
    }

    try {
        const querySnapshot = await getDocs(collection(window.db, "blogPosts"));
        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('blog-post');
            postElement.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
            blogSection.appendChild(postElement);
        });
    } catch (error) {
        console.error("Error loading blog posts:", error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const blogSection = document.getElementById('blog-posts');

    // Only attempt to load blog posts if the blogSection element exists on the page
    if (blogSection) {
        try {
            await loadBlogPosts();  // Load blog posts when DOM is fully loaded
        } catch (error) {
            console.error("Error loading blog posts:", error);
        }
    }
});
