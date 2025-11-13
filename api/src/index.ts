import { greet } from "@monorepo/shared";

const server = Bun.serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
      return new Response(greet("API Server"));
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
