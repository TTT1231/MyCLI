/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
   AxiosInstance,
   AxiosRequestConfig,
   AxiosResponse,
   CreateAxiosDefaults,
} from 'axios';

import { bindMethods, merge } from '../utils';
import axios from 'axios';

import { type RequestClientOptions } from './types';

class RequestClient {
   private readonly instance: AxiosInstance;

   /**
    * 构造函数，用于创建Axios实例
    * @param options - Axios请求配置，可选
    */
   constructor(options: RequestClientOptions = {}) {
      // 合并默认配置和传入的配置
      const defaultConfig: CreateAxiosDefaults = {
         headers: {
            'Content-Type': 'application/json;charset=utf-8',
         },
         // 默认超时时间
         timeout: 10_000,
      };
      const { ...axiosConfig } = options;
      const requestConfig = merge(axiosConfig, defaultConfig);
      this.instance = axios.create(requestConfig);

      bindMethods(this);
   }

   /**
    * DELETE请求方法
    */

   public delete<T = any>(
      url: string,
      config?: AxiosRequestConfig
   ): Promise<T> {
      return this.request<T>(url, { ...config, method: 'DELETE' });
   }

   /**
    * GET请求方法
    */
   public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
      return this.request<T>(url, { ...config, method: 'GET' });
   }

   /**
    * POST请求方法
    */
   public post<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
   ): Promise<T> {
      return this.request<T>(url, { ...config, data, method: 'POST' });
   }

   /**
    * PUT请求方法
    */
   public put<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
   ): Promise<T> {
      return this.request<T>(url, { ...config, data, method: 'PUT' });
   }

   /**
    * 通用的请求方法
    */
   public async request<T>(
      url: string,
      config: AxiosRequestConfig
   ): Promise<T> {
      try {
         const response: AxiosResponse<T> = await this.instance({
            url,
            ...config,
         });
         return response as T;
      } catch (error: any) {
         throw error.response ? error.response.data : error;
      }
   }
}
const $requestClient = new RequestClient({
   baseURL: '/api',
});
export { $requestClient };
