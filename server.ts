import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/routes/api.ts';
import { db } from './server/config/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database
  try {
    await db.init();
    console.log('[Server] Database initialized successfully.');
  } catch (err) {
    console.error('[Server] Database initialization failure:', err);
  }

  // Mount API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SkillSwap Global API',
      database: db.getIsMySql() ? 'MySQL (External)' : 'Relational SQL Engine (Embedded)',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` SkillSwap Global Server running at http://0.0.0.0:${PORT}`);
    console.log(` Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(` Database: ${db.getIsMySql() ? 'MySQL (mysql2)' : 'Persistent SQL Database'}`);
    console.log(` Default Admin: admin@skillswap.in | Password@123`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]', err);
  process.exit(1);
});
