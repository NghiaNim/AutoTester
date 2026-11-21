import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export type Route = { status: number; body: string | Uint8Array; contentType: string };

export type FixtureServer = { url(path: string): string; close(): Promise<void> };

/** Serves saved web snapshots and deliberately broken pages over real HTTP on localhost. */
export async function startFixtureServer(routes: Map<string, Route>): Promise<FixtureServer> {
  const server = createServer((req, res) => {
    const route = routes.get((req.url ?? "/").split("?")[0]!);
    if (!route) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }
    res.writeHead(route.status, { "Content-Type": route.contentType }).end(route.body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: (path) => `http://127.0.0.1:${port}${path}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
