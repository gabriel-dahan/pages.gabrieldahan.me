<script setup lang="ts">
import { reactive, computed, ref } from 'vue'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  consent: false,
})

const errors = reactive({ name: '', email: '', message: '' })
const submitting = ref(false)
const status = reactive({ message: '', success: false })

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function validate() {
  errors.name = (form.name.trim() || form.name === '') ? '' : 'Name is required.'
  errors.email = (emailRegex.test(form.email) || form.email === '') ? '' : 'Invalid email address.'
  errors.message = (form.message.trim().length >= 10 || form.message === '') ? '' : 'Message must be at least 10 characters.'
  return !errors.name && !errors.email && !errors.message && form.consent
}

const isValid = computed(() => validate())

async function submitForm() {
  if (!validate()) {
    status.message = 'Please correct the errors before sending.'
    status.success = false
    return
  }

  submitting.value = true
  status.message = ''

  try {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      }),
    })

    status.message = 'Message sent successfully — I\'ll get back to you soon.'
    status.success = true

    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    form.consent = false
  } catch (e) {
    console.error(e)
    status.message = 'Failed to send message. Please try again later.'
    status.success = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full term-fade-in font-mono">
    <h1 class="app__subtitle mb-6">
      <span class="term-dim">$</span> ./contact
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <div class="term-frame" data-title="info">
        <p class="term-dim text-sm mb-4">
          You can send me a message using this form or use the links in the footer.
        </p>

        <div class="space-y-3 text-sm">
          <div>
            <div class="term-dim">email&gt;</div>
            <div>work@gabrieldahan.me</div>
          </div>
          <div>
            <div class="term-dim">location&gt;</div>
            <div>Rennes, France</div>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitForm" class="term-frame" data-title="compose" novalidate>
        <div class="grid gap-4">
          <div>
            <label class="term-dim text-sm block mb-1">name&gt;</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="_"
              class="term-input"
              :class="{ 'term-error': errors.name }"
            />
            <p v-if="errors.name" class="term-error text-xs mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label class="term-dim text-sm block mb-1">email&gt;</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="_"
              class="term-input"
              :class="{ 'term-error': errors.email }"
            />
            <p v-if="errors.email" class="term-error text-xs mt-1">{{ errors.email }}</p>
          </div>

          <div>
            <label class="term-dim text-sm block mb-1">subject&gt;</label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="_"
              class="term-input"
            />
          </div>

          <div>
            <label class="term-dim text-sm block mb-1">message&gt;</label>
            <textarea
              v-model="form.message"
              rows="6"
              placeholder="_"
              class="term-textarea"
              :class="{ 'term-error': errors.message }"
            ></textarea>
            <p v-if="errors.message" class="term-error text-xs mt-1">{{ errors.message }}</p>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label class="flex items-start gap-2 text-xs term-dim cursor-pointer">
              <input id="consent" type="checkbox" v-model="form.consent" class="mt-0.5 accent-[var(--term-fg)]" />
              <span>I consent to my data being used for contact purposes.</span>
            </label>

            <button
              :disabled="submitting || !isValid"
              class="term-btn shrink-0"
              type="submit"
            >
              <span v-if="!submitting">$ send</span>
              <span v-else>sending<span class="cursor-blink" /></span>
            </button>
          </div>

          <div
            v-if="status.message"
            :class="status.success ? '' : 'term-error'"
            class="text-sm mt-1"
          >
            <span class="term-dim">{{ status.success ? 'ok:' : 'err:' }}</span> {{ status.message }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
