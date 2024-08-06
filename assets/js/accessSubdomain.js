// assets/js/access-subdomain.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();

    const checkAccess = () => {
        const user = auth.currentUser;
        if (user) {
            user.getIdToken().then(token => {
                fetch(`https://labase.languapps.com/api/check-access?uid=${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.accessGranted) {
                        window.location.href = 'https://labase.languapps.com';
                    } else {
                        alert('Access to the subdomain is denied.');
                    }
                })
                .catch(error => console.error('Error checking access:', error));
            });
        } else {
            alert('You need to sign in first.');
        }
    };

    const accessButton = document.getElementById('access-subdomain');
    if (accessButton) {
        accessButton.addEventListener('click', checkAccess);
    }

    onAuthStateChanged(auth, user => {
        if (!user) {
       // User is not signed in, redirect to login page
            window.location.href = 'https://languapps.com/login';
        }
    });
});
