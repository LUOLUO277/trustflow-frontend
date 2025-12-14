# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

```
src/
├── assets/             # 静态资源
├── components/         # 公共组件
│   ├── common/         # 通用组件 (Button, Input 等)
│   ├── layout/         # 布局组件 (Sidebar, Header - FE-1负责)
│   └── business/       # 业务组件 (如 ChatBubble, FileUploader)
├── hooks/              # 自定义 Hooks (useWeb3, useStream)
├── pages/              # 页面级组件
│   ├── auth/           # 登录页 (FE-1)
│   ├── chat/           # 创作端/对话页 (FE-1)
│   ├── knowledge/      # 知识库管理 (FE-2)
│   ├── verify/         # 验证终端 (FE-2)
│   └── dashboard/      # 落地页/仪表盘 (FE-2)
├── services/           # API 接口管理 (根据后端模块拆分)
│   ├── api.ts          # Axios 实例与拦截器 (FE-1)
│   ├── authService.ts  # 认证相关接口
│   ├── chatService.ts  # 对话相关接口
│   └── kbService.ts    # 知识库相关接口
├── store/              # 全局状态管理 (Zustand)
│   ├── useAuthStore.ts # 用户与Token状态
│   └── useAppStore.ts  # 全局UI状态
├── utils/              # 工具函数
│   ├── web3.ts         # 钱包连接工具
│   └── format.ts       # 格式化工具
├── App.tsx             # 路由配置入口
└── main.tsx
```