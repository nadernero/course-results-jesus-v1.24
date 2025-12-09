import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  process.env = {...process.env, ...loadEnv(mode, (process as any).cwd(), '')}
  return defineConfig({
    plugins: [react()],
    // 
    // تم حذف الجزء 'define' بالكامل من هنا
    // لأنه كان يتسبب في كشف المفتاح السري للمتصفح
    //
  })
}