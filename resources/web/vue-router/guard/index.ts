import type { Router } from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

export const setupRouterGuard = (router: Router) => {
   router.beforeEach((to, from, next) => {
      NProgress.start();
      next();
   });

   router.afterEach((to, from, failure) => {
      if (failure) {
         NProgress.done(true);
      } else {
         NProgress.done();
      }
   });
};
