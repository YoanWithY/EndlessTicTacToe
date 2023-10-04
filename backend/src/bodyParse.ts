import * as http from 'http';

export function bodyAsBuffer(request: http.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        request.on('error', (error) => {
            reject(error);
        });

        const contentLength = request.headers['content-length'];
        if (!contentLength) throw new Error("Could not read content length!");
        const bodyLength = parseInt(contentLength as string);
        const bodyBuffer = Buffer.alloc(bodyLength);
        let bytesRead = 0;
        request.on('data', (chunk: Buffer) => {
            chunk.copy(bodyBuffer, bytesRead);
            bytesRead += chunk.byteLength;
        });

        request.on('end', () => {
            resolve(bodyBuffer);
        });
    });
}

export async function bodyAsObject<T>(reqest: http.IncomingMessage): Promise<T> {
    const buf = await bodyAsBuffer(reqest);
    return JSON.parse(buf.toString()) as T;
}