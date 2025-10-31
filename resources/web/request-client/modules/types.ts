/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosResponse, CreateAxiosDefaults } from 'axios';

type RequestResponse<T = any> = AxiosResponse<T>;

type RequestContentType =
   | 'application/json;charset=utf-8'
   | 'application/octet-stream;charset=utf-8'
   | 'application/x-www-form-urlencoded;charset=utf-8'
   | 'multipart/form-data;charset=utf-8';

type RequestClientOptions = CreateAxiosDefaults;

interface HttpResponse<T = any> {
   /**
    * 0 表示成功 其他表示失败
    * 0 means success, others means fail
    */
   code: number;
   data: T;
   message: string;
}

export type {
   HttpResponse,
   RequestClientOptions,
   RequestContentType,
   RequestResponse,
};
