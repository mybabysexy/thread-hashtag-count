// This script runs on threads.net pages
console.log("Thread Hashtag Counter extension is active");

// create loading spinner
const loadingSpinner = document.createElement("div");
loadingSpinner.id = "counter-loading-spinner";
loadingSpinner.style.position = "fixed";
loadingSpinner.style.width = "100%";
loadingSpinner.style.height = "100%";
loadingSpinner.style.top = "0";
loadingSpinner.style.left = "0";
loadingSpinner.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
loadingSpinner.style.zIndex = "9999";
loadingSpinner.style.display = "none";
loadingSpinner.style.justifyContent = "center";
loadingSpinner.style.alignItems = "center";
loadingSpinner.style.color = "white";
loadingSpinner.style.fontSize = "24px";
loadingSpinner.style.fontWeight = "bold";

const logo = document.createElement("img");
logo.src = chrome.runtime.getURL("sidebar/thread-logo.svg");
logo.style.width = "100px";
logo.style.height = "100px";

// make the logo spin
logo.style.animation = "thread-logo-spin 1s ease-in-out infinite";
const style = document.createElement("style");
style.textContent = `
  @keyframes thread-logo-spin {
    0% {
        transform: rotate(0deg) scale(1);
    }
        
    50% {
        transform: rotate(180deg) scale(1.5);
    }
        
    100% {
        transform: rotate(360deg) scale(1);
    }
    }
  }
`;
document.head.appendChild(style);

loadingSpinner.appendChild(logo);
document.body.appendChild(loadingSpinner);
