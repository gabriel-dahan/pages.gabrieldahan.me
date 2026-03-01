import { createWebHistory, createRouter } from 'vue-router'
import Home from './views/Home.vue'
import Contact from './views/Contact.vue'
import Resume from './views/Resume.vue'
import Projects from './views/Projects.vue'
import Private from './views/Private.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/contact', component: Contact },
  { path: '/resume', component: Resume },
  { path: '/projects', component: Projects },
  { path: '/private', component: Private },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
