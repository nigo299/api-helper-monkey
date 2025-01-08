import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Swagger API Helper',
        version: '1.0.19',
        description: 'Enhanced Swagger Documentation Helper - 自动生成 TypeScript 接口定义的增强工具',
        author: 'Nigo',
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: ['http://192.168.0.*/doc.html*'],
        include: [/^http:\/\/192\.168\.0\.\d{1,3}:\d+\/doc\.html.*$/],
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
          axios: cdn.jsdelivr('axios', 'dist/axios.min.js')
        },
      },
    }),
  ],
});
