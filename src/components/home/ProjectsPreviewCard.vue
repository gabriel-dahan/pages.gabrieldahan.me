<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const preview = ref<{ name: string; tag: string }[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/projects?featured=1')
    if (!res.ok) throw new Error('upstream')
    const data = await res.json()
    preview.value = (data.projects || []).map((p: { title: string; themes: string[] }) => ({
      name: p.title,
      tag: p.themes?.[0] || 'project',
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <RouterLink to="/projects" class="term-card term-card-link block" data-title="projects">
    <p class="term-dim text-xs mb-3">$ ls ./projects</p>
    <p v-if="loading" class="text-sm term-dim flex-grow">
      reading<span class="cursor-blink" aria-hidden="true" />
    </p>
    <ul v-else class="space-y-2 text-sm flex-grow">
      <li v-for="item in preview" :key="item.name" class="flex items-center justify-between gap-2">
        <span>
          <span class="term-dim">›</span> {{ item.name }}
        </span>
        <span class="term-tag">[{{ item.tag }}]</span>
      </li>
      <li v-if="preview.length === 0" class="term-dim"># empty</li>
    </ul>
    <p class="term-bright text-sm mt-4 pt-3 border-t border-[var(--term-border)]">
      cd ./projects <span class="term-dim">→</span>
    </p>
  </RouterLink>
</template>
