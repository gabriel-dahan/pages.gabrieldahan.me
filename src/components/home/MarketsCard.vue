<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type Coin = { price: number | null; change24h: number | null }

type MarketsData = {
  bitcoin: Coin
  ethereum: Coin
  sparkline: number[]
  meta: string
}

const loading = ref(true)
const error = ref('')
const data = ref<MarketsData | null>(null)

const sparkPoints = computed(() => {
  const pts = data.value?.sparkline || []
  if (pts.length < 2) return ''
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const w = 100
  const h = 36
  return pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 2) - 1
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
})

const btcUp = computed(() => (data.value?.bitcoin.change24h ?? 0) >= 0)

function fmtUsd(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtChange(n: number | null) {
  if (n == null) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/toys/markets')
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
  <section class="term-card" data-title="markets">
    <p class="term-dim text-xs mb-3">$ curl /api/toys/markets</p>

    <div v-if="loading" class="text-sm term-dim flex-grow">
      polling<span class="cursor-blink" aria-hidden="true" />
    </div>
    <p v-else-if="error" class="term-error text-sm flex-grow">err: {{ error }}</p>
    <template v-else-if="data">
      <div class="space-y-3 text-sm flex-grow">
        <div class="flex items-baseline justify-between gap-2">
          <span class="term-dim">BTC</span>
          <span class="term-bright tabular-nums font-semibold">{{ fmtUsd(data.bitcoin.price) }}</span>
        </div>
        <div class="flex items-baseline justify-between gap-2">
          <span class="term-muted text-xs">24h</span>
          <span
            class="text-xs tabular-nums"
            :class="btcUp ? 'term-bright' : 'term-error'"
          >
            {{ fmtChange(data.bitcoin.change24h) }}
          </span>
        </div>

        <svg
          v-if="sparkPoints"
          class="w-full mt-1"
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke="var(--term-fg)"
            stroke-width="1.25"
            vector-effect="non-scaling-stroke"
            :points="sparkPoints"
          />
        </svg>

        <div class="flex items-baseline justify-between gap-2 pt-2 border-t border-[var(--term-border)]">
          <span class="term-dim">ETH</span>
          <div class="text-right">
            <p class="tabular-nums">{{ fmtUsd(data.ethereum.price) }}</p>
            <p
              class="text-xs tabular-nums"
              :class="(data.ethereum.change24h ?? 0) >= 0 ? 'term-bright' : 'term-error'"
            >
              {{ fmtChange(data.ethereum.change24h) }}
            </p>
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
