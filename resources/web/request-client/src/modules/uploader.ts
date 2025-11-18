import { isUndefined } from '../../utils';
import type { RequestClient } from '../request-client';
import type { RequestClientConfig, RequestContentType } from '../types';

class FileUploader {
   private client: RequestClient;
   constructor(client: RequestClient) {
      this.client = client;
   }

   async upload<T = any>(
      url: string,
      data: Record<string, any> & { file: File | Blob },
      config?: RequestClientConfig
   ): Promise<T> {
      const formData = new FormData();

      /**
     * @rawdata 
      const data = {
         name: 'John',
         age: 30,
         hobbies: ['reading', 'gaming'],
         file: new Blob(['file content'], { type: 'text/plain' }),
      };
      @transformdata
      name: John
      age: 30
      hobbies[0]: reading
      hobbies[1]: gaming
      file: [object Blob]
     */
      Object.entries(data).forEach(([key, value]) => {
         if (Array.isArray(value)) {
            value.forEach((item, index) => {
               !isUndefined(item) && formData.append(`${key}[${index}]`, item);
            });
         } else {
            !isUndefined(value) && formData.append(key, value);
         }
      });

      const finalConfig: RequestClientConfig = {
         ...config,
         headers: {
            'Content-Type':
               'multipart/form-data;charset=utf-8' as const satisfies RequestContentType,
            ...config?.headers
         }
      };

      return this.client.post<T>(url, formData, finalConfig);
   }
}

export { FileUploader };