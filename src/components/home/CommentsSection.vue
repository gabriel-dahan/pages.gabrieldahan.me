<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Comment = {
  id: number
  author: string
  message: string
  created_at: string
}

const comments = ref<Comment[]>([])
const loading = ref(true)
const author = ref('')
const message = ref('')
const submitting = ref(false)
const formError = ref('')
const formOk = ref('')

const loadComments = async () => {
  try {
    const res = await fetch('/api/comments')
    if (!res.ok) throw new Error('Failed to load')
    const data = await res.json()
    comments.value = data.comments || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadComments)

const submit = async () => {
  formError.value = ''
  formOk.value = ''
  submitting.value = true
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: author.value, message: message.value }),
    })
    const data = await res.json()
    if (!res.ok) {
      formError.value = data.error || 'Failed to post comment'
      return
    }
    formOk.value = '// queued for review'
    author.value = ''
    message.value = ''
  } catch {
    formError.value = 'Failed to connect to server'
  } finally {
    submitting.value = false
  }
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso + (iso.endsWith('Z') || iso.includes('+') ? '' : 'Z')).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <section class="term-frame w-full" data-title="comments">
    <h2 class="text-base sm:text-lg mb-4">
      <span class="term-dim">$</span> cat ./guestbook.log
    </h2>

    <div v-if="loading" class="text-sm term-dim mb-6">
      loading<span class="cursor-blink" aria-hidden="true" />
    </div>
    <div v-else-if="comments.length === 0" class="text-sm term-dim mb-6">
      # no approved comments yet
    </div>
    <ul v-else class="space-y-4 mb-6">
      <li
        v-for="c in comments"
        :key="c.id"
        class="border-b border-[var(--term-border)] pb-3 last:border-0"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2 text-xs term-dim mb-1">
          <span class="term-bright">{{ c.author }}</span>
          <span>{{ formatDate(c.created_at) }}</span>
        </div>
        <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ c.message }}</p>
      </li>
    </ul>

    <form class="space-y-3 border-t border-[var(--term-border)] pt-4" @submit.prevent="submit">
      <p class="term-dim text-xs mb-1">$ echo &gt;&gt; guestbook.log</p>
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <label class="term-dim shrink-0 text-sm" for="comment-author">name:</label>
        <input
          id="comment-author"
          v-model="author"
          type="text"
          required
          maxlength="64"
          class="term-input flex-1"
          placeholder="_"
          autocomplete="nickname"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label class="term-dim shrink-0 text-sm" for="comment-message">message:</label>
        <textarea
          id="comment-message"
          v-model="message"
          required
          maxlength="1000"
          rows="3"
          class="term-textarea w-full"
          placeholder="_"
        />
      </div>
      <p v-if="formError" class="term-error text-sm">err: {{ formError }}</p>
      <p v-else-if="formOk" class="term-dim text-sm">{{ formOk }}</p>
      <button type="submit" class="term-btn" :disabled="submitting">
        {{ submitting ? 'sending…' : '$ post' }}
      </button>
    </form>
  </section>
</template>
