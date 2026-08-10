import { createWebHistory, createRouter } from 'vue-router'
import Home from './views/Home.vue'
import Contact from './views/Contact.vue'
import Resume from './views/Resume.vue'
import Projects from './views/Projects.vue'
import Private from './views/Private.vue'
import Photography from './views/Photography.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/contact', component: Contact },
  { path: '/resume', component: Resume },
  { path: '/projects', component: Projects },
  { path: '/private', component: Private },
  { path: '/photography', component: Photography }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
