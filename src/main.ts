import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './routes'
import { useTerminalTheme } from './composables/useTerminalTheme'

useTerminalTheme()

const app = createApp(App)

app.use(router)

app.mount('#app')
