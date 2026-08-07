<script setup lang="ts">
import ExternalLinkIcon from './icons/ExternalLinkIcon.vue';
import GitHubIcon from './icons/GitHubIcon.vue';

defineProps({
    title: {
        type: String,
        default: 'Project Title'
    },
    description: {
        type: String,
        default: 'This is a brief description of the project.'
    },
    themes: {
        type: Array as () => string[],
        default: () => ['Vue', 'TypeScript', 'DaisyUI']
    },
    banner: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: null
    },
    githubLink: {
        type: String,
        default: null
    }
});
</script>

<template>
    <article class="term-card w-full h-full flex flex-col gap-3" :data-title="`./${title}`">
        <img
            v-if="banner"
            :src="banner"
            :alt="title"
            class="w-full max-h-40 object-cover border border-[var(--term-border)]"
        />

        <div class="flex items-start justify-between gap-2">
            <h2 class="font-semibold text-base sm:text-lg term-bright">
                {{ title }}
            </h2>
            <a
                v-if="link"
                class="term-btn text-xs shrink-0"
                :href="link"
                target="_blank"
                rel="noopener noreferrer"
            >
                link
                <ExternalLinkIcon />
            </a>
        </div>

        <p class="text-sm flex-grow leading-relaxed">
            {{ description }}
        </p>

        <div class="flex flex-wrap items-end justify-between gap-3 mt-2 pt-2 border-t border-[var(--term-border)]">
            <a
                v-if="githubLink"
                :href="githubLink"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:opacity-70 transition-opacity term-bright"
                :aria-label="`${title} on GitHub`"
            >
                <GitHubIcon width="18" height="18" />
            </a>
            <div v-else></div>

            <div class="flex flex-wrap gap-1 justify-end">
                <span class="term-tag" v-for="theme in themes" :key="String(theme)">[{{ theme }}]</span>
            </div>
        </div>
    </article>
</template>
