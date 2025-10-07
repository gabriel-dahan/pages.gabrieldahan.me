<script setup lang="ts">
import ProjectCard from '../components/ProjectCard.vue';

const projects = {
    comx: {
        title: "COMX",
        banner: "",
        description: "A comics/manga/... reading platform with AI-driven translation.",
        themes: ["VueJS", "TypeScript"],
        link: 'https://comx.click/',
        // githubLink: 'https://github.com/gabriel-dahan/comx-app.git' // <-- Private repository
    },
    vadermap: {
        title: "VaderMap",
        banner: "",
        description: "A private open-source map featuring Invader's artworks.",
        themes: ["Python", "Flask"],
        link: 'https://vaderm.app/',
        githubLink: 'https://github.com/gabriel-dahan/vadermap.git'
    },
    personalWebsite: {
        title: "Pages",
        banner: "",
        description: "My personal website, portfolio and blog.",
        themes: ["VueJS", "TypeScript", "Vite", "DaisyUI"],
        link: 'https://gabrieldahan.me/',
        githubLink: 'https://github.com/gabriel-dahan/pages.gabrieldahan.me.git'
    }
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <h1 class="app__subtitle text-center">Projects</h1>
        <div class="flex flex-wrap gap-6 justify-center">
            <ProjectCard v-for="proj in projects" :banner="proj.banner" :title="proj.title" :themes="proj.themes" :description="proj.description" :link="proj.link" :githubLink="proj.githubLink"/>
        </div>
    </div>
</template>