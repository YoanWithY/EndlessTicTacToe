const http = require('http');

const server = http.createServer(function (request, response) {
  response.writeHead(200, { "Content-Type": "text/html" });
  response.end("<html><body><h1>Hello World! From HTTP Server!</h1></body></html>");
});

const port = process.env.PORT || 3000;
server.listen(port);

console.log(`Server running at http://localhost:${port}`);