// Production entry point for cPanel / shared-hosting Node.js apps.
// This thin wrapper exists so the hosting panel can point at a file in the
// project root while the real bundle lives in dist/server.js.
process.env.NODE_ENV = process.env.NODE_ENV || "production";
require("./dist/server.js");
