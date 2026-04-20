import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Ensure server-only packages don't leak to client
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "better-sqlite3"],
};

export default nextConfig;
