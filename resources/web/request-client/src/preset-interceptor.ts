import { isFunction } from '../utils';
import type { ResponseInterceptorConfig } from './types';

//默认响应拦截器
export const defaultResponseInterceptor = ({
   codeField = 'code',
   dataField = 'data',
   successCode = 0
}: {
   /**代表访问结果的字段名，默认为code */
   //!注意，这个要和后端返回的字段名一致
   codeField: string;
   /**响应数据中实际装载数据的字段名默认为data,或者提供自定义解析函数返回解析数据，函数接受response.data */
   //!注意，这个要和后端返回的数据字段名一致
   dataField: string | ((data: any) => any);
   /**
    * @description 找字段
    * 当codeField和successCode相同，代表接口访问成功 如果提供了一个函数返回true代表接口访问成功。
    * successCode: 'success' or 0 or (code) => code === 'success'
    */
   //!注意，这个的值要和codeField对应的后端返回值一致，或者提供一个函数来判断
   successCode: ((code: any) => boolean) | number | string;
}): ResponseInterceptorConfig => {
   return {
      fulfilled: (response) => {
         const { config, data: responseData, status } = response;

         if (config.responseReturn === 'raw') {
            return response;
         }

         //这个·responseData[codeField]·表示从data中取对应字段的值
         if (status >= 200 && status < 400) {
            if (config.responseReturn === 'body') {
               return responseData;
            } else if (
               isFunction(successCode)
                  ? successCode(responseData[codeField])
                  : responseData[codeField] === successCode
            ) {
               return isFunction(dataField) ? dataField(responseData) : responseData[dataField];
            }
         }
         throw Object.assign({}, response, { response });
      }
   };
};