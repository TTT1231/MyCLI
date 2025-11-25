import type { Router, Express } from 'express';

function setupRouter(app: Express, router: Router) {
   router.get('/', (_, res) => {
      res.send('hello world');
   });

   app.use(router);
}

export { setupRouter };
