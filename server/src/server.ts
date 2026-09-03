import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureDefaultSettings } from './models/AppSettings.model.js';

async function main() {
  await connectDb();
  await ensureDefaultSettings();
  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
