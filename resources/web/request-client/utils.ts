/* eslint-disable @typescript-eslint/no-explicit-any */
export function bindMethods<T extends object>(instance: T): void {
   const prototype = Object.getPrototypeOf(instance);
   const propertyNames = Object.getOwnPropertyNames(prototype);

   propertyNames.forEach(propertyName => {
      const descriptor = Object.getOwnPropertyDescriptor(
         prototype,
         propertyName
      );
      const propertyValue = instance[propertyName as keyof T];

      if (
         typeof propertyValue === 'function' &&
         propertyName !== 'constructor' &&
         descriptor &&
         !descriptor.get &&
         !descriptor.set
      ) {
         instance[propertyName as keyof T] = propertyValue.bind(instance);
      }
   });
}

// merge 方法实现
export function merge<T extends object>(...sources: Partial<T>[]): T {
   if (sources.length === 0) return {} as T;
   const target = { ...sources[0] } as Record<string, any>;

   for (let i = 1; i < sources.length; i++) {
      const source = sources[i] as Record<string, any>;
      if (!source) continue;

      for (const key in source) {
         if (Object.prototype.hasOwnProperty.call(source, key)) {
            const targetValue = target[key];
            const sourceValue = source[key];

            // 如果是对象且不是数组，递归合并（处理嵌套对象如 headers）
            if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
               target[key] = merge(targetValue, sourceValue);
            } else if (sourceValue !== undefined) {
               // 非对象类型或数组，直接覆盖（用户配置优先）
               target[key] = sourceValue;
            }
         }
      }
   }

   return target as T;
}

// 辅助函数：判断是否为纯对象（排除数组、null、Date等特殊对象）
function isPlainObject(value: any): value is object {
   return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === '[object Object]'
   );
}
