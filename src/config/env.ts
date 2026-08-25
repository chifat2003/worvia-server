import "dotenv/config";

const requiredEnv = ["NEONDB_URL"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.NEONDB_URL as string,
};
