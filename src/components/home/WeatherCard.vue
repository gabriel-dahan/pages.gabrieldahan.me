<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type WeatherData = {
  place: string
  source: string
  temperature: number | null
  feelsLike: number | null
  humidity: number | null
  wind: number | null
  condition: string
  glyph: string
  units: { temperature: string; wind: string }
  meta: string
}

const loading = ref(true)
const error = ref('')
const data = ref<WeatherData | null>(null)

const humidityWidth = computed(() =>
  data.value?.humidity != null ? `${Math.min(100, Math.max(0, data.value.humidity))}%` : '0%',
)

const windWidth = computed(() => {
  const w = data.value?.wind
  if (w == null) return '0%'
  return `${Math.min(100, Math.round((w / 60) * 100))}%`
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/toys/weather')
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'failed')
    data.value = json
  } catch {
    error.value = 'fetch failed — try again'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="term-card" data-title="weather">
    <p class="term-dim text-xs mb-3">$ curl /api/toys/weather</p>

    <div v-if="loading" class="text-sm term-dim flex-grow">
      resolving ip<span class="cursor-blink" aria-hidden="true" />
    </div>
    <p v-else-if="error" class="term-error text-sm flex-grow">err: {{ error }}</p>
    <template v-else-if="data">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0">
          <p class="term-bright text-sm truncate" :title="data.place">{{ data.place }}</p>
          <p class="term-muted text-xs mt-1">via {{ data.source }}</p>
        </div>
        <span class="term-tag shrink-0">[{{ data.glyph }}]</span>
      </div>

      <p class="term-bright text-3xl sm:text-4xl tabular-nums font-semibold tracking-tight">
        {{ data.temperature != null ? Math.round(data.temperature) : '—' }}{{ data.units.temperature }}
      </p>
      <p class="text-sm mt-1 capitalize">{{ data.condition }}</p>
      <p v-if="data.feelsLike != null" class="term-dim text-xs mt-1">
        feels {{ Math.round(data.feelsLike) }}{{ data.units.temperature }}
      </p>

      <div class="mt-4 space-y-2 text-xs">
        <div>
          <div class="flex justify-between gap-2 mb-1">
            <span class="term-dim">humidity</span>
            <span class="tabular-nums">{{ data.humidity ?? '—' }}%</span>
          </div>
          <div class="h-1.5 border border-[var(--term-border)] bg-[var(--term-bg)]">
            <div class="h-full bg-[var(--term-fg-dim)] transition-all duration-500" :style="{ width: humidityWidth }" />
          </div>
        </div>
        <div>
          <div class="flex justify-between gap-2 mb-1">
            <span class="term-dim">wind</span>
            <span class="tabular-nums">{{ data.wind != null ? Math.round(data.wind) : '—' }} {{ data.units.wind }}</span>
          </div>
          <div class="h-1.5 border border-[var(--term-border)] bg-[var(--term-bg)]">
            <div class="h-full bg-[var(--term-fg-dim)] transition-all duration-500" :style="{ width: windWidth }" />
          </div>
        </div>
      </div>
    </template>

    <div class="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[var(--term-border)]">
      <span class="term-muted text-xs truncate">{{ data?.meta || '—' }}</span>
      <button type="button" class="term-btn text-xs py-1" :disabled="loading" @click="load">
        $ refresh
      </button>
    </div>
  </section>
</template>
