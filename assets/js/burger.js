// burger.js
//_         __      __   _     _       _     _      __      ___      ___      __  
// |       /  \    |  \ | |   //  __  | |   | |    /  \    |   \    |   \    / _/
// |      / /\ \   | |\\| |  ((  |_ | | |   | |   / /\ \   | () )   | () )  ( (
// |__   /  __  \  | | \  |   \\__//  |  \_/  |  /  __  \  | __/    | __/   _) )
//____| /__/  \__\ |_|  \_|    \__/    \_____/  /__/  \__\ |_|      |_|     \__/
$(document).ready(function() {
    // Select the hamburger menu icon and assign a click event handler
    $('.hamburger-menu').click(function() {
        // Toggle the 'active' class on the navigation menu
        $('nav ul').toggleClass('active');
    });

    // If you have additional toggle buttons or elements, you can include them here
    // For example, if you have a button with the ID 'hamburger-toggle' as mentioned earlier
    $('#hamburger-toggle').click(function() {
        // This would toggle the 'active' class on an element with the ID 'navigation'
        $('#navigation').toggleClass('active');
    });

    // Add any additional jQuery code related to the hamburger menu here
});
