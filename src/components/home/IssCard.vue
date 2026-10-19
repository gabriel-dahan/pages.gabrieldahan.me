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

/** Equirectangular: viewBox 0 0 360 180 → x = lon+180, y = 90-lat */
const marker = computed(() => {
  const lat = data.value?.latitude
  const lon = data.value?.longitude
  if (lat == null || lon == null) return null
  return { x: lon + 180, y: 90 - lat }
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
      <div class="iss-map border border-[var(--term-border)] bg-[var(--term-bg)] mb-3 overflow-hidden">
        <svg
          class="iss-map__svg block w-full h-auto"
          viewBox="0 0 360 180"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          :aria-label="`ISS at ${data.latitude?.toFixed(1)}°, ${data.longitude?.toFixed(1)}°`"
        >
          <!-- lat/lon grid -->
          <g class="iss-map__grid" aria-hidden="true">
            <line v-for="x in [0, 60, 120, 180, 240, 300, 360]" :key="'v'+x" :x1="x" y1="0" :x2="x" y2="180" />
            <line v-for="y in [0, 45, 90, 135, 180]" :key="'h'+y" x1="0" :y1="y" x2="360" :y2="y" />
          </g>

          <!-- Simplified landmasses in lon/lat space (x=lon+180, y=90-lat) -->
          <g class="iss-map__land" aria-hidden="true">
            <!-- North America -->
            <path d="M28 42 L48 28 L78 26 L95 34 L108 48 L102 62 L88 72 L70 78 L52 74 L38 66 L30 54 Z" />
            <!-- Greenland -->
            <path d="M118 18 L132 14 L140 24 L134 38 L120 36 L114 26 Z" />
            <!-- South America -->
            <path d="M98 88 L112 84 L122 96 L126 118 L118 142 L108 148 L100 132 L96 108 Z" />
            <!-- Europe -->
            <path d="M168 38 L188 34 L198 40 L196 52 L182 56 L170 50 Z" />
            <!-- Africa -->
            <path d="M168 62 L198 58 L212 72 L216 98 L204 128 L186 132 L172 112 L166 84 Z" />
            <!-- Asia -->
            <path d="M200 28 L248 22 L292 30 L310 48 L298 68 L268 74 L232 70 L208 56 L198 42 Z" />
            <!-- India -->
            <path d="M248 72 L262 70 L268 88 L256 98 L246 86 Z" />
            <!-- SE Asia / Indonesia -->
            <path d="M278 88 L302 86 L318 96 L308 108 L286 104 Z" />
            <!-- Australia -->
            <path d="M288 118 L318 112 L338 124 L332 142 L304 146 L286 134 Z" />
            <!-- Antarctica fringe -->
            <path d="M20 168 L100 162 L200 166 L300 160 L350 168 L350 178 L10 178 Z" />
          </g>

          <g v-if="marker">
            <circle
              class="iss-map__pulse"
              :cx="marker.x"
              :cy="marker.y"
              r="7"
            />
            <rect
              class="iss-map__dot"
              :x="marker.x - 2.5"
              :y="marker.y - 2.5"
              width="5"
              height="5"
            />
          </g>
        </svg>
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
.iss-map__svg {
  display: block;
}

.iss-map__grid line {
  stroke: var(--term-border);
  stroke-width: 0.4;
  opacity: 0.7;
}

.iss-map__land path {
  fill: color-mix(in srgb, var(--term-fg) 16%, transparent);
  stroke: var(--term-fg-dim);
  stroke-width: 0.55;
  stroke-linejoin: round;
}

.iss-map__dot {
  fill: var(--term-fg-bright);
  stroke: var(--term-bg);
  stroke-width: 0.6;
  transition: x 0.8s ease, y 0.8s ease;
}

.iss-map__pulse {
  fill: color-mix(in srgb, var(--term-fg) 22%, transparent);
  transition: cx 0.8s ease, cy 0.8s ease;
}

@media (prefers-reduced-motion: reduce) {
  .iss-map__dot,
  .iss-map__pulse {
    transition: none;
  }
}
</style>
