<script setup lang="ts">
import ProjectCard from '../components/ProjectCard.vue';

interface Project {
  title: string
  banner: string
  description: string
  themes: string[]
  link: string
  githubLink?: string
}

const projects: Project[] = [
    {
        title: "BloomScape",
        banner: "",
        description: "[UNDER DEV] BloomScape is a web-based, persistent multiplayer game. It features a complex closed economy where players trade flowers and use sap as a virtual currency.",
        themes: ["NextJS", "TypeScript", "three.js"],
        link: "",
        githubLink: "https://github.com/gabriel-dahan/bloomscape"
    },
    {
        title: "BigBrother",
        banner: "",
        description: "[UNDER DEV] A open-source software that generates complete datasets and databases analysis.",
        themes: ["Python", "SQL", "LaTeX"],
        link: "",
        githubLink: "https://github.com/kevinbrgl/bigbrother.git"
    },
    {
        title: "COMX",
        banner: "",
        description: "[UNDER DEV] A comics/manga/... reading platform with AI-driven translation.",
        themes: ["VueJS", "TypeScript"],
        link: 'https://comx.click/',
        // githubLink: 'https://github.com/gabriel-dahan/comx-app.git' // <-- Private repository
    },
    {
        title: "VaderMap",
        banner: "",
        description: "An open-source mapping system featuring Invader's artworks.",
        themes: ["Python", "Flask"],
        // link: 'https://vaderm.app/', // <-- Not online anymore
        link: "",
        githubLink: 'https://github.com/gabriel-dahan/vadermap.git'
    },
    {
        title: "Pages",
        banner: "",
        description: "My personal website, portfolio and blog.",
        themes: ["VueJS", "TypeScript"],
        link: 'https://gabrieldahan.me/',
        githubLink: 'https://github.com/gabriel-dahan/pages.gabrieldahan.me.git'
    },
]
</script>

<template>
    <div class="flex flex-col gap-6">
        <h1 class="app__subtitle text-center">Projects</h1>
        <div class="flex flex-wrap gap-6 justify-center">
            <ProjectCard v-for="proj in projects" :banner="proj.banner" :title="proj.title" :themes="proj.themes" :description="proj.description" :link="proj.link" :githubLink="proj.githubLink"/>
        </div>
    </div>
</template>