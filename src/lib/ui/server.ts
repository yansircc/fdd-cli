import { spawn } from "node:child_process";
import {
	type IncomingMessage,
	type ServerResponse,
	createServer,
} from "node:http";
import { createServer as createNetServer } from "node:net";
import { networkInterfaces } from "node:os";
import { handleRequest } from "./routes.js";

interface ServerOptions {
	port?: number;
	open?: boolean;
}

/**
 * Start the UI server
 */
export async function startServer(
	cwd: string,
	options: ServerOptions = {},
): Promise<void> {
	const startPort = options.port ?? 3088;
	const shouldOpen = options.open ?? true;

	// Find available port
	const port = await findAvailablePort(startPort);

	// Start HTTP server using Node.js http module
	const server = createServer(
		async (req: IncomingMessage, res: ServerResponse) => {
			try {
				// Convert Node.js request to Web Request
				const url = new URL(req.url || "/", `http://localhost:${port}`);
				const headers = new Headers();
				for (const [key, value] of Object.entries(req.headers)) {
					if (value) {
						headers.set(key, Array.isArray(value) ? value.join(", ") : value);
					}
				}

				const webRequest = new Request(url.toString(), {
					method: req.method,
					headers,
				});

				// Handle with our router
				const response = await handleRequest(webRequest, cwd);

				// Convert Web Response to Node.js response
				res.statusCode = response.status;
				response.headers.forEach((value, key) => {
					res.setHeader(key, value);
				});

				const body = await response.arrayBuffer();
				res.end(Buffer.from(body));
			} catch (error) {
				console.error("Server error:", error);
				res.statusCode = 500;
				res.end("Internal Server Error");
			}
		},
	);

	server.listen(port);

	// Get local IP for LAN sharing
	const localIp = getLocalIp();

	console.log();
	console.log("FDD UI running at:");
	console.log(`  Local:   http://localhost:${port}`);
	if (localIp) {
		console.log(`  Network: http://${localIp}:${port}`);
	}
	console.log();
	console.log("Press Ctrl+C to stop");

	// Try to open browser (silent fail)
	if (shouldOpen) {
		openBrowser(`http://localhost:${port}`);
	}

	// Keep server running
	await new Promise(() => {});
}

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort: number): Promise<number> {
	let port = startPort;
	const maxAttempts = 10;

	for (let i = 0; i < maxAttempts; i++) {
		if (await isPortAvailable(port)) {
			return port;
		}
		port++;
	}

	// If all attempts failed, return the last tried port
	return port;
}

/**
 * Check if a port is available using Node.js net module
 */
async function isPortAvailable(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const server = createNetServer();

		server.once("error", () => {
			resolve(false);
		});

		server.once("listening", () => {
			server.close(() => {
				resolve(true);
			});
		});

		server.listen(port);
	});
}

/**
 * Get local network IP address
 */
function getLocalIp(): string | null {
	const interfaces = networkInterfaces();

	for (const name of Object.keys(interfaces)) {
		const ifaceList = interfaces[name];
		if (!ifaceList) continue;

		for (const iface of ifaceList) {
			// Skip internal and non-IPv4 addresses
			if (iface.internal || iface.family !== "IPv4") continue;
			return iface.address;
		}
	}

	return null;
}

/**
 * Try to open browser (silent fail for headless environments)
 */
function openBrowser(url: string): void {
	const platform = process.platform;

	try {
		let command: string;
		let args: string[];

		if (platform === "darwin") {
			command = "open";
			args = [url];
		} else if (platform === "win32") {
			command = "cmd";
			args = ["/c", "start", url];
		} else {
			command = "xdg-open";
			args = [url];
		}

		// Use Node.js child_process.spawn
		const child = spawn(command, args, {
			stdio: "ignore",
			detached: true,
		});
		child.unref();
	} catch {
		// Silent fail - headless environment
	}
}
