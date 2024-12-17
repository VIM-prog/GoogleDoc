import { registerPlugins } from '@/plugins'
import App from './App.vue'
import { createApp } from "vue"
import router from "@/router";
import {createPinia} from "pinia";

const pinia = createPinia()
const app = createApp(App)
app.use(router)
app.use(pinia)

registerPlugins(app)

app.mount('#app')
