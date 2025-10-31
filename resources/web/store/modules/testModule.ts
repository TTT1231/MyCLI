import { defineStore } from 'pinia';
import { pinia } from '..';

//测试模块
export const useTestStore = defineStore('test-store', {
   state: (): {
      test1: string | null;
   } => ({
      test1: null,
   }),
   getters: {
      getTest1: state => state.test1,
   },
   actions: {
      setTest1(value: string) {
         this.test1 = value;
      },
   },
});

//setup之外使用
export function useTestStoreWithOut() {
   return useTestStore(pinia);
}
