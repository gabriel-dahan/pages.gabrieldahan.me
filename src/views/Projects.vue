<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'

interface Project {
  id: number
  title: string
  banner: string
  description: string
  themes: string[]
  link: string
  githubLink?: string | null
  category: 'personal' | 'academic'
}

const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref('')

const personal = computed(() => projects.value.filter((p) => p.category === 'personal'))
const academic = computed(() => projects.value.filter((p) => p.category === 'academic'))

onMounted(async () => {
  try {
    const res = await fetch('/api/projects')
    if (!res.ok) throw new Error('Failed to load projects')
    const data = await res.json()
    projects.value = data.projects || []
  } catch (err) {
    console.error(err)
    error.value = 'err: failed to load ./projects'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="w-full flex flex-col gap-8 term-fade-in font-mono">
    <h1 class="app__subtitle">
      <span class="term-dim">$</span> ls ./projects
    </h1>

    <p v-if="loading" class="text-sm term-dim">
      reading<span class="cursor-blink" aria-hidden="true" />
    </p>
    <p v-else-if="error" class="term-error text-sm">{{ error }}</p>
    <template v-else>
      <p v-if="personal.length === 0" class="term-dim text-sm"># no personal projects</p>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
        <ProjectCard
          v-for="proj in personal"
          :key="proj.id"
          :banner="proj.banner"
          :title="proj.title"
          :themes="proj.themes"
          :description="proj.description"
          :link="proj.link"
          :githubLink="proj.githubLink || undefined"
        />
      </div>

      <div class="term-dim text-sm my-2" aria-hidden="true">{{ '─'.repeat(40) }}</div>

      <h1 class="app__subtitle">
        <span class="term-dim">$</span> ls ./academic
      </h1>
      <p v-if="academic.length === 0" class="term-dim text-sm"># no academic projects</p>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
        <ProjectCard
          v-for="proj in academic"
          :key="proj.id"
          :banner="proj.banner"
          :title="proj.title"
          :themes="proj.themes"
          :description="proj.description"
          :link="proj.link"
          :githubLink="proj.githubLink || undefined"
        />
      </div>
    </template>
  </div>
</template>
