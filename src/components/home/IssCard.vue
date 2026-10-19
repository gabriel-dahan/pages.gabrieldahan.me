<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type IssData = {
  latitude: number | null
  longitude: number | null
  altitudeKm: number | null
  velocityKmh: number | null
  visibility: string
  meta: string
}

const loading = ref(true)
const error = ref('')
const data = ref<IssData | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const mapX = computed(() => {
  const lon = data.value?.longitude
  if (lon == null) return 50
  return ((lon + 180) / 360) * 100
})

const mapY = computed(() => {
  const lat = data.value?.latitude
  if (lat == null) return 50
  return ((90 - lat) / 180) * 100
})

async function load(silent = false) {
  if (!silent) {
    loading.value = true
    error.value = ''
  }
  try {
    const res = await fetch('/api/toys/iss')
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'failed')
    data.value = json
  } catch {
    if (!silent) error.value = 'fetch failed — try again'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  timer = setInterval(() => load(true), 15000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="term-card" data-title="iss">
    <p class="term-dim text-xs mb-3">$ track iss --live</p>

    <div v-if="loading && !data" class="text-sm term-dim flex-grow">
      acquiring lock<span class="cursor-blink" aria-hidden="true" />
    </div>
    <p v-else-if="error && !data" class="term-error text-sm flex-grow">err: {{ error }}</p>
    <template v-else-if="data">
      <div
        class="iss-map relative w-full aspect-[2/1] border border-[var(--term-border)] bg-[var(--term-bg)] mb-3 overflow-hidden"
        aria-hidden="true"
      >
        <div class="iss-map__grid" />
        <div
          class="iss-map__dot"
          :style="{ left: `${mapX}%`, top: `${mapY}%` }"
        />
      </div>

      <div class="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <p class="term-dim text-xs">lat</p>
          <p class="term-bright tabular-nums">
            {{ data.latitude != null ? data.latitude.toFixed(2) : '—' }}°
          </p>
        </div>
        <div>
          <p class="term-dim text-xs">lon</p>
          <p class="term-bright tabular-nums">
            {{ data.longitude != null ? data.longitude.toFixed(2) : '—' }}°
          </p>
        </div>
        <div>
          <p class="term-dim text-xs">alt</p>
          <p class="tabular-nums">
            {{ data.altitudeKm != null ? Math.round(data.altitudeKm) : '—' }} km
          </p>
        </div>
        <div>
          <p class="term-dim text-xs">vel</p>
          <p class="tabular-nums">
            {{ data.velocityKmh != null ? Math.round(data.velocityKmh) : '—' }} km/h
          </p>
        </div>
      </div>
      <p v-if="data.visibility" class="term-muted text-xs mt-3">
        visibility: {{ data.visibility }}
      </p>
    </template>

    <div class="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[var(--term-border)]">
      <span class="term-muted text-xs truncate">{{ data?.meta || '—' }} · 15s</span>
      <button type="button" class="term-btn text-xs py-1" :disabled="loading" @click="load()">
        $ refresh
      </button>
    </div>
  </section>
</template>

<style scoped>
.iss-map__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--term-border) 70%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--term-border) 70%, transparent) 1px, transparent 1px);
  background-size: 12.5% 25%;
  opacity: 0.55;
}

.iss-map__dot {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 1px;
  background: var(--term-fg-bright);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--term-fg) 25%, transparent);
  transition: left 0.8s ease, top 0.8s ease;
}

@media (prefers-reduced-motion: reduce) {
  .iss-map__dot {
    transition: none;
  }
}
</style>
