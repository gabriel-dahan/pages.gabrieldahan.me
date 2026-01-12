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
        default: 'https://via.placeholder.com/400x200.png?text=Project+Banner'
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
    <div class="card w-90 shadow-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
        <figure>
            <img
            :src="banner" />
        </figure>
        <div class="card-body">
            <div class="absolute top-2 right-2 flex gap-2" v-if="link">
                <a class="badge badge-soft badge-primary btn" :href="link" target="_blank">Link <ExternalLinkIcon /></a>
            </div>
            <h2 class="card-title">
                {{ title }}
            </h2>
            <p>{{ description }}</p>
            <a :href="githubLink" target="_blank" class="absolute left-6 bottom-6" v-if="githubLink">
                <GitHubIcon width="20" height="20"/>
            </a>
            <div class="card-actions justify-end mt-5">
                <div class="badge badge-sm badge-outline" v-for="theme in themes">{{ theme }}</div>
            </div>
        </div>
    </div>
</template>