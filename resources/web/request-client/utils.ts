/* eslint-disable @typescript-eslint/no-explicit-any */
import { defu as merge } from 'defu';
/**
 * bindMethods(this) 会遍历当前实例的原型方法，把每个“普通函数方法”都用 Function.prototype.bind 绑定到该实例上，确保方法里的 this 永远指向这个实例。
 * 仅绑定“普通方法”，不会动构造函数、getter/setter、非函数属性。
 * 其实现大致逻辑是：拿到原型 → 枚举属性 → 如果是函数且不是 constructor 、不是 getter/setter → method = method.bind(instance) 。
 *
 * 主要就是支持 const {method1} = instance; method1()不会出现this指向错误的问题。
 */
export function bindMethods<T extends object>(instance: T): void {
   const prototype = Object.getPrototypeOf(instance);
   const propertyNames = Object.getOwnPropertyNames(prototype);

   propertyNames.forEach(propertyName => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
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

export {merge}

//判断是否是函数
export function isFunction(value: unknown): value is Function {
   return typeof value === 'function';
}

//判断是否是undefined
export function isUndefined(value: unknown): value is undefined {
   return typeof value === 'undefined';
}

