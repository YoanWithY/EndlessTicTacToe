const http = require("http");
const port = process.env.port || 3000;

http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello there!");
}).listen(port);

console.log(`Server is running at http://localhost:${port}`);