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
  <div class="w-full max-w-4xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left: Contact info -->
      <div class="card bg-base-300 shadow-xl p-6">
        <div class="card-body">
          <h2 class="card-title text-2xl">Contact Me</h2>
          <p class="text-sm opacity-80 mb-4">
            You can send me a message using this form or use the links in the footer.
          </p>

          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-9 12V8" />
              </svg>
              <div>
                <div class="font-medium">Email</div>
                <div class="text-sm opacity-70">work@gabrieldahan.me</div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M3 5h2l2 7 4-2 4 2 2-7h2" />
              </svg>
              <div>
                <div class="font-medium">Location</div>
                <div class="text-sm opacity-70">Rennes, France</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form -->
      <form @submit.prevent="submitForm" class="card bg-base-300 shadow-lg p-6" novalidate>
        <div class="card-body">
          <div class="grid gap-4">
            <div>
              <label class="label mb-2">
                <span class="label-text">Name</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Your name"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.name }"
              />
              <p v-if="errors.name" class="text-error text-sm mt-1">{{ errors.name }}</p>
            </div>

            <div>
              <label class="label mb-2">
                <span class="label-text">Email</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="you@email.com"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.email }"
              />
              <p v-if="errors.email" class="text-error text-sm mt-1">{{ errors.email }}</p>
            </div>

            <div>
              <label class="label mb-2">
                <span class="label-text">Subject</span>
              </label>
              <input
                v-model="form.subject"
                type="text"
                placeholder="Message subject"
                class="input input-bordered w-full"
              />
            </div>

            <div>
              <label class="label mb-2">
                <span class="label-text">Message</span>
              </label>
              <textarea
                v-model="form.message"
                rows="6"
                placeholder="Write your message..."
                class="textarea textarea-bordered w-full"
                :class="{ 'textarea-error': errors.message }"
              ></textarea>
              <p v-if="errors.message" class="text-error text-sm mt-1">{{ errors.message }}</p>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <input id="consent" type="checkbox" v-model="form.consent" class="checkbox" />
                <label for="consent" class="text-sm opacity-80">
                  I consent to my data being used for contact purposes.
                </label>
              </div>

              <div>
                <button
                  :disabled="submitting || !isValid"
                  class="btn btn-primary"
                  type="submit"
                >
                  <span v-if="!submitting">Send</span>
                  <span v-else class="loading">Sending...</span>
                </button>
              </div>
            </div>

            <div
              v-if="status.message"
              :class="status.success ? 'text-success' : 'text-error'"
              class="text-sm mt-2"
            >
              {{ status.message }}
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.card {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.card:hover {
  transform: translateY(-4px);
}

.input-error {
  border-color: #f43f5e;
}

.textarea-error {
  border-color: #f43f5e;
}
</style>
