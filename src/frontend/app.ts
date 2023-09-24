console.log("Hello from frontend Javascript!");
const mainDiv = document.getElementById("mainDiv");
if (mainDiv)
    mainDiv.appendChild(document.createTextNode("Hello from client side Javascript."))