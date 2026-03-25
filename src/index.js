const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/database');

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
