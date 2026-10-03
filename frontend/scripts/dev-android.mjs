import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { join } from "node:path";
import { parse } from "node:url";
import next from "next";

const projectDirectory = process.cwd();
const certificateDirectory = join(projectDirectory, ".local-certs");
const pfxPath = join(certificateDirectory, "pointa-dev.pfx");
const passwordPath = join(certificateDirectory, "pointa-dev-password.txt");
const localEnv = readFileSync(join(projectDirectory, ".env"), "utf8");
const configuredApiUrl = localEnv.match(/^NEXT_PUBLIC_API_URL=(.+)$/m)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, "");

let backendUrl = process.env.POINTA_BACKEND_URL;

if (!backendUrl && configuredApiUrl) {
    backendUrl = new URL(configuredApiUrl).origin;
}

if (!backendUrl) {
    throw new Error("Définissez POINTA_BACKEND_URL avec l'adresse du serveur Laravel.");
}

process.env.POINTA_BACKEND_URL = backendUrl;
process.env.NEXT_PUBLIC_API_URL = "/api/v1";
process.env.NEXT_DIST_DIR = ".next-android";

const port = Number(process.env.PORT ?? 3101);
const app = next({ dev: true, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer(
    {
        pfx: readFileSync(pfxPath),
        passphrase: readFileSync(passwordPath, "utf8").trim(),
    },
    async (request, response) => {
        await handle(request, response, parse(request.url ?? "/", true));
    },
);

server.listen(port, "0.0.0.0", () => {
    console.log(`POINTA disponible en HTTPS sur https://${new URL(backendUrl).hostname}:${port}.`);
    console.log(`API Laravel relayée depuis ${backendUrl}.`);
});
