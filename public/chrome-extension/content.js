// Content script - runs on web pages
// Allows web pages to communicate with extension

// Inject script file to access chrome.runtime (avoids CSP inline script violation)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);


