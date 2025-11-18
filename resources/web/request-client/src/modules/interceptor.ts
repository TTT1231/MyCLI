import type { AxiosInstance, AxiosResponse } from 'axios';
import type { RequestInterceptorConfig, ResponseInterceptorConfig } from '../types';

//==================== 默认拦截器配置====================
//解决只定义一个导致的问题
const defaultRequestInterceptorConfig: RequestInterceptorConfig = {
   fulfilled: (config) => config,
   rejected: (error) => Promise.reject(error)
};
const defaultResponseInterceptorConfig: ResponseInterceptorConfig = {
   fulfilled: (response: AxiosResponse) => response,
   rejected: (error) => Promise.reject(error)
};

//==================== 拦截器管理类====================
class InterceptorManager {
   private axiosInstance: AxiosInstance;

   constructor(instance: AxiosInstance) {
      this.axiosInstance = instance;
   }

   addRequestInterceptor({
      fulfilled,
      rejected
   }: RequestInterceptorConfig = defaultRequestInterceptorConfig) {
      this.axiosInstance.interceptors.request.use(fulfilled, rejected);
   }

   addResponseInterceptor<T = any>({
      fulfilled,
      rejected
   }: ResponseInterceptorConfig<T> = defaultResponseInterceptorConfig) {
      this.axiosInstance.interceptors.response.use(fulfilled, rejected);
   }
}

export { InterceptorManager };