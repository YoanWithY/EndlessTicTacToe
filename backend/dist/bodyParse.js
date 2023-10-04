"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyAsObject = exports.bodyAsBuffer = void 0;
function bodyAsBuffer(request) {
    return new Promise((resolve, reject) => {
        request.on('error', (error) => {
            reject(error);
        });
        const contentLength = request.headers['content-length'];
        if (!contentLength)
            throw new Error("Could not read content length!");
        const bodyLength = parseInt(contentLength);
        const bodyBuffer = Buffer.alloc(bodyLength);
        let bytesRead = 0;
        request.on('data', (chunk) => {
            chunk.copy(bodyBuffer, bytesRead);
            bytesRead += chunk.byteLength;
        });
        request.on('end', () => {
            resolve(bodyBuffer);
        });
    });
}
exports.bodyAsBuffer = bodyAsBuffer;
async function bodyAsObject(reqest) {
    const buf = await bodyAsBuffer(reqest);
    return JSON.parse(buf.toString());
}
exports.bodyAsObject = bodyAsObject;
