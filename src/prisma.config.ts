import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: path.resolve(__dirname, "../prisma/schema.prisma"),
  migrations: {
    path: path.resolve(__dirname, "../prisma/migrations"),
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
