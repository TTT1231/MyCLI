/// <reference types="vite/client" />

//必须以前缀VITE_开头才能在Vite项目中使用自定义环境变量
interface ImportMetaEnv {
   //示例
   readonly VITE_API_BASE_URL: string;
}

//如果您需要声明import.meta上存在给定的属性，则可以通过接口合并来增强此类型。
interface ImportMeta {
   readonly env: ImportMetaEnv;
}
