<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import Typewriter from '../components/Typewriter.vue'
import ClockCard from '../components/home/ClockCard.vue'
import ProjectsPreviewCard from '../components/home/ProjectsPreviewCard.vue'
import ApiToysCard from '../components/home/ApiToysCard.vue'
import CommentsSection from '../components/home/CommentsSection.vue'

const step = ref(0)

const lines = [
  "I'm a student at ENSAI — the French National School for Statistics and Data Analysis — where I study mathematics, statistics, and data science.",
  "I'm passionate about programming, data-driven projects, and the intersection between theoretical modeling and practical implementation.",
  'I enjoy exploring a wide range of topics in computer science, from algorithm design and data visualization to software engineering and AI applications. What I love most is turning complex ideas into elegant, efficient, and meaningful solutions.',
  "Over time, I've worked on projects involving Python, Vue.js, TypeScript, OCaml, R, and more, which have helped me develop both strong analytical skills and a solid technical mindset.",
  "When I'm not coding or working on data-related challenges, I enjoy doing photography and hanging out. I'm always eager to learn, create, and collaborate on ideas that make a real impact.",
  "Welcome to my portfolio — feel free to explore my work and reach out if you'd like to collaborate or discuss new projects!",
]

function next() {
  step.value += 1
}

function skip() {
  step.value = lines.length + 2
}

const aboutDone = () => step.value >= lines.length + 2
</script>

<template>
  <div class="w-full term-fade-in font-mono space-y-8">
    <header class="w-full">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <Typewriter
            v-if="step === 0"
            text="Gabriel Dahan"
            as="h1"
            class="app__title mt-0 mb-2"
            :speed="36"
            @done="next"
          />
          <h1 v-else class="app__title mt-0 mb-2">Gabriel Dahan</h1>
          <p v-if="step >= 1" class="term-dim text-sm">
            student @ ENSAI · stats · data · code
          </p>
        </div>
        <button
          v-if="!aboutDone()"
          type="button"
          class="term-btn text-xs shrink-0 mt-1"
          @click="skip"
        >
          skip
        </button>
      </div>
    </header>

    <section v-if="step >= 1" class="term-frame" data-title="about">
      <h2 class="text-base sm:text-lg mb-4">
        <span class="term-dim">$</span> whoami
        <Typewriter
          v-if="step === 1"
          text="Hi, I'm Gabriel"
          as="span"
          class="ml-2 term-bright"
          :speed="28"
          @done="next"
        />
        <span v-else-if="step > 1" class="ml-2 term-bright">Hi, I'm Gabriel</span>
      </h2>

      <div class="space-y-3 text-sm sm:text-base leading-relaxed">
        <template v-for="(line, index) in lines" :key="index">
          <p v-if="step >= index + 2">
            <span class="term-dim mr-2">›</span>
            <Typewriter
              v-if="step === index + 2"
              :text="line"
              :speed="12"
              @done="next"
            />
            <span v-else>{{ line }}</span>
          </p>
        </template>
      </div>

      <p v-if="aboutDone()" class="text-sm mt-5 pt-4 border-t border-[var(--term-border)]">
        <span class="term-dim">$</span>
        <RouterLink to="/projects" class="term-link ml-2">cd ./projects</RouterLink>
        <span class="term-dim mx-2">|</span>
        <RouterLink to="/contact" class="term-link">./contact</RouterLink>
        <span class="cursor-blink" aria-hidden="true" />
      </p>
    </section>

    <section
      v-if="aboutDone()"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full pt-2 term-fade-in"
    >
      <ProjectsPreviewCard />
      <ClockCard />
      <ApiToysCard />
    </section>

    <CommentsSection v-if="aboutDone()" />
  </div>
</template>
