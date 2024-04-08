// facebookSDKSetup.js

window.fbAsyncInit = function() {
    FB.init({
      appId      : 776174730748503, // Replace with your Facebook app ID
      cookie     : true,
      xfbml      : true,
      version    : 'v10.0', // Replace with the Facebook API version, e.g., 'v9.0'
    });
  
    FB.AppEvents.logPageView();
  };
  
  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
  