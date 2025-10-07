import { createWebHistory, createRouter } from 'vue-router'
import Home from './views/Home.vue'
import Contact from './views/Contact.vue'
import Resume from './views/Resume.vue'
import Projects from './views/Projects.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/contact', component: Contact },
  { path: '/resume', component: Resume },
  { path: '/projects', component: Projects },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
