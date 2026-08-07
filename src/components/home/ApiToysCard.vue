<script setup lang="ts">
import { onMounted, ref } from 'vue'

type WidgetKey = 'advice' | 'cat' | 'joke'

const active = ref<WidgetKey>('advice')
const loading = ref(false)
const error = ref('')
const content = ref('')
const meta = ref('')

async function load(kind: WidgetKey = active.value) {
  active.value = kind
  loading.value = true
  error.value = ''
  content.value = ''
  meta.value = ''

  try {
    const res = await fetch(`/api/toys/${kind}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'failed')
    content.value = data.text ?? ''
    meta.value = data.meta ?? ''
  } catch {
    error.value = 'fetch failed — try again'
  } finally {
    loading.value = false
  }
}

onMounted(() => load('cat'))
</script>

<template>
  <section class="term-card" data-title="api_toys">
    <p class="term-dim text-xs mb-3">$ curl /api/toys/{{ active }}</p>

    <div class="flex flex-wrap gap-2 mb-4">
      <button
        type="button"
        class="term-btn text-xs py-1"
        :class="{ active: active === 'cat' }"
        @click="load('cat')"
      >
        cat_fact
      </button>
      <button
        type="button"
        class="term-btn text-xs py-1"
        :class="{ active: active === 'joke' }"
        @click="load('joke')"
      >
        joke
      </button>
    </div>

    <div class="flex-grow text-sm leading-relaxed min-h-[5.5rem]">
      <p v-if="loading" class="term-dim">
        fetching<span class="cursor-blink" aria-hidden="true" />
      </p>
      <p v-else-if="error" class="term-error">err: {{ error }}</p>
      <p v-else class="term-bright">{{ content }}</p>
    </div>

    <div class="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[var(--term-border)]">
      <span class="term-muted text-xs truncate">{{ meta || '—' }}</span>
      <button type="button" class="term-btn text-xs py-1" :disabled="loading" @click="load()">
        $ refresh
      </button>
    </div>
  </section>
</template>
