<script setup lang="ts">

const props = defineProps({
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
    }
});

</script>

<template>
    <div class="card bg-base-100 w-96 shadow-sm">
        <figure>
            <img
            :src="banner"
            alt="Shoes" />
        </figure>
        <div class="card-body">
            <h2 class="card-title">
                {{ title }}
            </h2>
            <p>{{ description }}</p>
            <div class="card-actions justify-end">
                <div class="badge badge-outline" v-for="theme in themes">{{ theme }}</div>
            </div>
        </div>
    </div>
</template>