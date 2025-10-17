// 全局类型声明
declare global {
  interface Window {
    __ROUTES_WIRED__: boolean;
    Alpine: any;
    page: any;
    PageRuntime: any;
    axios: any;
    Toastify: any;
  }
}

declare const Alpine: any;
declare const page: any;
declare const PageRuntime: any;
declare const axios: any;
declare const Toastify: any;

export {};
