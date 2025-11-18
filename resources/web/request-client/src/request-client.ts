import type { AxiosInstance, AxiosResponse } from 'axios';
import { InterceptorManager } from './modules/interceptor';
import type { RequestClientConfig, RequestClientOptions, RequestContentType } from './types';
import { bindMethods,merge} from '../utils';
import qs from 'qs';
import axios from 'axios';
import { FileDownloader } from './modules/downloader';
import { FileUploader } from './modules/uploader';

//参数序列化
function getParamsSerializer(paramsSerializer: RequestClientOptions['paramsSerializer']) {
   if (typeof paramsSerializer === 'string') {
      switch (paramsSerializer) {
         case 'brackets': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'brackets' });
         }
         case 'comma': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'comma' });
         }
         case 'indices': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'indices' });
         }
         case 'repeat': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'repeat' });
         }
      }
   }
   return paramsSerializer;
}
//请求客户端类
class RequestClient {
   public addRequestInterceptor: InterceptorManager['addRequestInterceptor'];
   public addResponseInterceptor: InterceptorManager['addResponseInterceptor'];

   public readonly instance: AxiosInstance;

   public download: FileDownloader['download'];
   public upload: FileUploader['upload'];

   /**
    * 构造函数，用于创建Axios实例
    * @param options - Axios请求配置，可选
    */
   constructor(options: RequestClientOptions = {}) {
      const defaultConfig: RequestClientOptions = {
         headers: {
            'Content-Type': 'application/json;charset=utf-8' as const satisfies RequestContentType
         },
         responseReturn: 'raw',
         //默认超时时间10s
         timeout: 10_000
      };
      const { ...axiosConfig } = options;
      const requestConfig = merge(axiosConfig, defaultConfig);

      // 仅在存在 paramsSerializer 时进行规范化，避免将 undefined 赋值导致类型错误
      // 没有就是用axios默认
      const normalizedParamsSerializer = getParamsSerializer(requestConfig.paramsSerializer);
      if (normalizedParamsSerializer !== undefined) {
         requestConfig.paramsSerializer = normalizedParamsSerializer;
      }
      this.instance = axios.create(requestConfig);

      bindMethods(this);

      //实例化拦截器管理器
      const interceptorManager = new InterceptorManager(this.instance);
      this.addRequestInterceptor =
         interceptorManager.addRequestInterceptor.bind(interceptorManager);
      this.addResponseInterceptor =
         interceptorManager.addResponseInterceptor.bind(interceptorManager);

      // 实例化文件上传和下载器
      const fileUploader = new FileUploader(this);
      this.upload = fileUploader.upload.bind(fileUploader);
      const fileDownloader = new FileDownloader(this);
      this.download = fileDownloader.download.bind(fileDownloader);
   }

   /**
    * DELETE 请求
    */
   public delete<T = any>(url: string, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, method: 'DELETE' });
   }

   /**
    * GET请求
    */
   public get<T = any>(url: string, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, method: 'GET' });
   }

   /**
    * POST请求
    */
   public post<T = any>(url: string, data?: any, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, data, method: 'POST' });
   }
   /**
    * PUT请求方法
    */
   public put<T = any>(url: string, data?: any, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, data, method: 'PUT' });
   }
   /**
    * request请求
    */
   public async request<T = any>(url: string, config: RequestClientConfig): Promise<T> {
      try {
         /**
          * ...(config.paramsSerializer ? { paramsSerializer: getParamsSerializer(config.paramsSerializer) } : {})
          * 如果在某次请求的config提供了paramsSerializer会覆盖全局设置;
          * 没有提供就默认采用RequestClient实例化的config，没有提供就是axios默认
          */
         const response: AxiosResponse<T> = await this.instance.request({
            url,
            ...config,
            ...(config.paramsSerializer
               ? { paramsSerializer: getParamsSerializer(config.paramsSerializer) }
               : {})
         } as any);
         return response as T;
      } catch (error: any) {
         throw error.response ? error.response.data : error;
      }
   }

   /**
    * 获取基础URL
    */
   public getBaseUrl() {
      return this.instance.defaults.baseURL;
   }
}

export { RequestClient };