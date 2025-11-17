import {
   WEB_ESLINT_DEV_DEPENDENCY,
   WEB_PRETTIER_DEV_DEPENDENCY,
   WEB_DEVTOOLS_DEV_DEPENDENCY,
   WEB_TAILWINDCSS_DEV_DEPENDENCY,
   WEB_ROUTER_DEPENDENCY,
   WEB_PINIA_DEPENDENCY,
   WEB_AXIOS_DEPENDENCY,
   WEB_TAILWINDCSS_DEPENDENCY,
   WEB_NPROGRESS_DEPENDENCY,
   WEB_ANT_DESIGN_VUE_DEPENDENCY,
   WEB_AUTO_COMPONENTS_DEV_DEPENDENCY,
   WEB_SCSS_DEPENDENCY,
} from './constant';

//web-eslint和pretter依赖
export function getWebEslintPrettierDevDependency(): Record<string, string> {
   return { ...WEB_ESLINT_DEV_DEPENDENCY, ...WEB_PRETTIER_DEV_DEPENDENCY };
}

//web-devtools依赖
export function getWebDevtoolsDevDependency(): Record<string, string> {
   return WEB_DEVTOOLS_DEV_DEPENDENCY;
}

//web-tailwindcss依赖
export function getWebTailwindcssDevDependency(): Record<string, string> {
   return WEB_TAILWINDCSS_DEV_DEPENDENCY;
}
export function getWebTailwindcssDependency(): Record<string, string> {
   return WEB_TAILWINDCSS_DEPENDENCY;
}

//web-vue-router依赖
export function getWebVueRouterDependency(): Record<string, string> {
   return WEB_ROUTER_DEPENDENCY;
}
export function getWebNProgressDependency(): Record<string, string> {
   return WEB_NPROGRESS_DEPENDENCY;
}

//web-pinia依赖
export function getWebPiniaDependency(): Record<string, string> {
   return WEB_PINIA_DEPENDENCY;
}

//web-axios依赖
export function getWebAxiosDependency(): Record<string, string> {
   return WEB_AXIOS_DEPENDENCY;
}
//scss 依赖
export function getWebScssDependency(): Record<string, string> {
   return WEB_SCSS_DEPENDENCY;
}

//web-ant-design-vue依赖
export function getWebAntDesignVueDependency(): Record<string, string> {
   return WEB_ANT_DESIGN_VUE_DEPENDENCY;
}
export function getWebAutoComponentsDependency(): Record<string, string> {
   return WEB_AUTO_COMPONENTS_DEV_DEPENDENCY;
}
