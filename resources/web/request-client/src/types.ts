/**
 * @param CreateAxiosDefaults 使用axios.create时传入的配置类型
 * @param InternalAxiosRequestConfig 相比配置多了一个headers属性
 *
 */
import type {
   AxiosRequestConfig,
   AxiosResponse,
   CreateAxiosDefaults,
   InternalAxiosRequestConfig
} from 'axios';

type ExtendOptions<T = any> = {
   /**
    * 主要就是解决param在各个框架中不一致的问题，导致识别不到参数
    * 参数序列化方式。预置的有
    * - brackets: ids[]=1&ids[]=2&ids[]=3
    * - comma: ids=1,2,3
    * - indices: ids[0]=1&ids[1]=2&ids[2]=3
    * - repeat: ids=1&ids=2&ids=3
    *
    * 最后一个AxiosRequestConfig<D>["paramsSerializer"];允许自定义参数序列化逻辑
    * 特别是当预置的几种方式不符合需求的时候
    */
   paramsSerializer?:
      | 'brackets'
      | 'comma'
      | 'indices'
      | 'repeat'
      | AxiosRequestConfig<T>['paramsSerializer'];

   /**
    * 响应数据的返回方式。
    * - raw: 原始的AxiosResponse，包括headers、status等，不做是否成功请求的检查。
    * - body: 返回响应数据的BODY部分（只会根据status检查请求是否成功，忽略对code的判断，这种情况下应由调用方检查请求是否成功）。
    * - data: 解构响应的BODY数据，只返回其中的data节点数据（会检查status和code是否为成功状态）。
    */
   responseReturn?: 'body' | 'data' | 'raw';
};

type RequestClientConfig<T = any> = AxiosRequestConfig<T> & ExtendOptions<T>;

type RequestResponse<T = any> = AxiosResponse<T> & {
   config: RequestClientConfig<T>;
};

type RequestContentType =
   | 'application/json;charset=utf-8'
   | 'application/octet-stream;charset=utf-8'
   | 'application/x-www-form-urlencoded;charset=utf-8'
   | 'multipart/form-data;charset=utf-8';

//请求options
type RequestClientOptions = CreateAxiosDefaults & ExtendOptions;

interface RequestInterceptorConfig {
   fulfilled: (
      config: InternalAxiosRequestConfig & ExtendOptions
   ) =>
      | (InternalAxiosRequestConfig<any> & ExtendOptions)
      | Promise<InternalAxiosRequestConfig<any> & ExtendOptions>;

   rejected?: (error: any) => any;
}

interface ResponseInterceptorConfig<T = any> {
   fulfilled: (response: RequestResponse<T>) => RequestResponse | Promise<RequestResponse>;
   rejected?: (error: any) => any;
}

export type {
   RequestClientConfig,
   RequestClientOptions,
   RequestContentType,
   RequestInterceptorConfig,
   RequestResponse,
   ResponseInterceptorConfig
};