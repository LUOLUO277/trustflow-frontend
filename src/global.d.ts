/// <reference types="vite/client" />

// 扩展 Window 接口
interface Window {
  ethereum: any; // 或者更严谨的话可以使用 Eip1193Provider 类型，但 any 足够用了
}