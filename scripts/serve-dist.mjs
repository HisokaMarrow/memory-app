import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const root = resolve("dist");
const port = Number(process.env.PORT ?? 5174);
const host = process.env.HOST ?? "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname.split("?")[0] || "/");
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return resolve(join(root, normalized));
}

function routeFile(pathname) {
  const filePath = safePath(pathname);
  if (!filePath.startsWith(root)) return null;

  if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;

  if (!extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    if (existsSync(htmlPath) && statSync(htmlPath).isFile()) return htmlPath;

    const indexPath = join(filePath, "index.html");
    if (existsSync(indexPath) && statSync(indexPath).isFile()) return indexPath;
  }

  return join(root, "+not-found.html");
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);
  const filePath = routeFile(url.pathname);

  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const status = filePath.endsWith("+not-found.html") ? 404 : 200;
  const contentType = mimeTypes[extname(filePath)] ?? "application/octet-stream";
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
});
