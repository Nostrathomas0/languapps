// assets/js/access-subdomain.js
document.addEventListener('DOMContentLoaded', () => {
    const checkAccess = () => {
        const user = auth.currentUser;
        if (user) {
            fetch(`https://labase.languapps.com/api/check-access?uid=${user.uid}`)
                .then(response => response.json())
                .then(data => {
                    if (data.accessGranted) {
                        window.location.href = 'https://labase.languapps.com';
                    } else {
                        alert('Access to the subdomain is denied.');
                    }
                })
                .catch(error => console.error('Error checking access:', error));
        }
    };

    const accessButton = document.getElementById('access-subdomain');
    if (accessButton) {
        accessButton.addEventListener('click', checkAccess);
    }
});
