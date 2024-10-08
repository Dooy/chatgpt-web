import path from 'path'
import type { PluginOption } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

function setupPlugins(env: ImportMetaEnv): PluginOption[] {
  return [
    vue(),
    env.VITE_GLOB_APP_PWA === 'true' && VitePWA({
      injectRegister: 'auto',
      manifest: {
        name: 'chatGPT',
        short_name: 'chatGPT',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),

  ]
}

export default defineConfig((env) => {
  const viteEnv = loadEnv(env.mode, process.cwd()) as unknown as ImportMetaEnv

  return {
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    plugins: setupPlugins(viteEnv),
    server: {
      host: '0.0.0.0',
      port: 4103,
      open: true,
      proxy: {
				'/api/cg': {
					target: viteEnv.VITE_CG_API_BASE_URL,
					changeOrigin: true, // 允许跨域
					rewrite: path => path.replace('/api/cg', '/'),
				},
				'/res/aidutu': {
					target: viteEnv.VITE_CG_API_BASE_URL,
					changeOrigin: true, // 允许跨域
					//rewrite: path => path.replace('/api/cg', '/'),
				},
         '/api/chat-v4': {
          target: viteEnv.VITE_APP_API_BASE_URL,
          changeOrigin: true, // 允许跨域
          rewrite: path => path.replace('/api/chat-v4', '/chat-me'),
        },
        '/api': {
          target: viteEnv.VITE_APP_API_BASE_URL,
          changeOrigin: true, // 允许跨域
          rewrite: path => path.replace('/api/', '/'),
        },
        '/backend-api/conversation': {
					//target: 'http://43.154.119.189:6019',
					target: 'https://beta.note123.net',
					changeOrigin: true, // 允许跨域
				},
         '/mmm-api/conversation': {
					target: 'https://demo.xyhelper.cn',
					changeOrigin: true, // 允许跨域
          rewrite: path => path.replace('/mmm-api/', '/backend-api/'),
				},

      },
    },
    build: {
      reportCompressedSize: false,
      sourcemap: false,
      commonjsOptions: {
        ignoreTryCatch: false,
      },

    }
  }
})
