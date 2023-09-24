import * as http from 'http';
import * as fs from "fs";
import * as path from "path";

function rootPath(p: string) {
    return path.normalize(__dirname + "/../../" + p);
}

function getContentTypeFromPath(path: string) {
    if (path.endsWith(".html"))
        return "text/html";

    if (path.endsWith(".svg"))
        return "image/svg+xml";

    return "text/plain";
}

function servFile(response: http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage
}, path?: string) {
    if (!path)
        return;
    try {
        const type = getContentTypeFromPath(path);
        const file = fs.readFileSync(rootPath(path));
        response.writeHead(200, { "Content-Type": type });
        response.end(file);
    } catch (err) {
        console.error(err);
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end("Error trying to serve a file.");
    }
}

const server = http.createServer(function (request, response) {
    if (request.url === "/") {
        servFile(response, "/index.html");
    } else {
        servFile(response, request.url);
    }
});

const port = process.env.PORT || 3000;
server.listen(port);

console.log(`Server running at http://localhost:${port}`);