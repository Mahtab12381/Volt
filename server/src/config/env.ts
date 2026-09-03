import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/electricity-bill'),
  port: Number(process.env.PORT ?? 4000),
};
