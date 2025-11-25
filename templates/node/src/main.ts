import express from 'express';
import http from 'http';
import { setupRouter } from './api/index.js';

async function bootstrap() {
   const app = express();
   const port = 3000;
   const router = express.Router();
   const server = http.createServer(app);

   //set up router
   setupRouter(app, router);

   server.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
   });
}

void bootstrap();
