# 环境变量验证注意

在环境变量验证中，不能将
```ts
interface ImportMetaEnv extends Record<ImportMetaEnvFallbackKey, any> {
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
```
其中的BASE_URL，MODE，DEV，PROD，SSR属性移除掉组合一个新类型，例如`type newType = Omit<ImportMetaEnv,'BASE_URL',...>`这时ts会推断不出来全局拓展的环境变量，也就没有了类型安全。

解决方案就是**保留它**，在需要的验证的地方例如`zod`中scheme只针对特定的变量进行验证，
parse验证时直接将`import.mata.env`进行解构赋值即可

如果想在vite启动时就对环境变量进行验证，使得验证不通过应用程序直接终止，那么就需要在`vite.config.ts`文件中在defineConfig进行验证，缺点就是要**手动加载环境变量**，vite不会自动处理，如下:
```ts
//vite.config.ts
export default defineConfig(({mode})=>{
   //手动加载环境变量,env-> Record<string,string>
   const env = loadEnv(mode,process.cwd().'path-to-envfile')//.env,.env*

   //validate env config
   validateEnv(env)
   
   return {
      plugins:[
         vue()
      ]
   }

})
```
同时为了更好的类型安全，这里的类型要手动定义，会导致重复定义了类型(例如，在env.d.ts中的`ImportMeta`的全局拓展env类型，但是也有解决方案，就是将需要的`envConfig`直接定义为全局类型，然后嵌入到`ImportMeta`中，`vite.config.ts`直接使用即可，就避免了重复类型定义，和维护多个类型问题)，例如:
```ts
//这是全局类型，这里是局部类型定义
type RequiredEnv = {
   VITE_API_BASE_URL: string;
};
type ViteEnv = RequiredEnv & Record<string, string>;

//类型安全，这是env.VITE_API_BASE_URL就会有类型提示了
const env = loadEnv(mode, process.cwd(), '') as ViteEnv;
```

这种手动没有vite自动加载BASE_URL，MODE，DEV，PROD，SSR属性，如果要对其进行验证就需要手动完成vite的这个功能