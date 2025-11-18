import {
   WEB_CODE_FORMAT,
   WEB_DEVTOOLS_DEV_DEPENDENCY,
   WEB_PINIA_DEPENDENCY,
   WEB_REQUEST,
   WEB_Component_VUE,
   WEB_SCSS_DEPENDENCY,
   WEB_TAILWINDCSS,
   WEB_ROUTER,
} from './constant';
import type { RequireDependencies } from './types';

//web代码格式化依赖
export function getWebCodeFormatRequireDep(): RequireDependencies {
   return WEB_CODE_FORMAT;
}

//web-devtools依赖
export function getWebDevtoolsDevDependency(): Record<string, string> {
   return WEB_DEVTOOLS_DEV_DEPENDENCY;
}

//web-tailwindcss依赖
export function getWebTailwindcssRequireDep(): RequireDependencies {
   return WEB_TAILWINDCSS;
}

//web-vue-router依赖
export function getWebVueRouterRequireDep(): RequireDependencies {
   return WEB_ROUTER;
}

//web-pinia依赖
export function getWebPiniaDependency(): Record<string, string> {
   return WEB_PINIA_DEPENDENCY;
}

//web请求相关依赖
export function getWebReuqestRequireDep(): RequireDependencies {
   return WEB_REQUEST;
}
//web组件库依赖
export function getWebComponentVueRequireDep(): RequireDependencies {
   return WEB_Component_VUE;
}
//scss 依赖
export function getWebScssDependency(): Record<string, string> {
   return WEB_SCSS_DEPENDENCY;
}
