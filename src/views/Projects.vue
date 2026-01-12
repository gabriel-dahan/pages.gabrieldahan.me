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
        title: "Contextify",
        banner: "",
        description: "A way to easily to share your project tree and content with LLMs using a single Markdown file !",
        themes: ["Python", "LLMs"],
        link: "",
        githubLink: "https://github.com/gabriel-dahan/prompt-contextify"
    },
    {
        title: "BloomScape",
        banner: "",
        description: "[UNDER DEV] BloomScape is a web-based, persistent multiplayer game. It features a complex closed economy where players trade flowers and use sap as a virtual currency.",
        themes: ["NextJS", "TypeScript", "three.js"],
        link: "",
        githubLink: "https://github.com/gabriel-dahan/bloomscape"
    },
    {
        title: "COMX",
        banner: "",
        description: "[UNDER DEV - PAUSED] A comics/manga/... reading platform with AI-driven translation.",
        themes: ["VueJS", "TypeScript"],
        link: 'https://comx.click/',
        // githubLink: 'https://github.com/gabriel-dahan/comx-app.git' // <-- Private repository
    },
    {
        title: "VaderMap",
        banner: "",
        description: "An open-source mapping system featuring Invader's artworks.",
        themes: ["Python", "Flask"],
        link: "https://vadermap.gabrieldahan.me",
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

const academicProjects: Project[] = [
    {
        title: "Economics Project at ENSAI",
        banner: "",
        description: "[NOT COMPLETED] Current academic project in economics (french). Theme: \"Skills Obsolescence and Employment\"",
        themes: ["Economics", "LaTeX", "Quarto"],
        link: "",
        githubLink: ""
    },
    {
        title: "Statistics Project at ENSAI",
        banner: "",
        description: "[NOT COMPLETED] Current academic project in statistics (french). Theme: \"Technologies and educational performance\"",
        themes: ["R", "Quarto", "LaTeX", "Stats", "Data"],
        link: "",
        githubLink: "https://github.com/gabriel-dahan/projet-statistique-1A-ENSAI"
    },
    {
        title: "TIPE",
        banner: "",
        description: "In french prepa, \"TIPE\" is a Two-Year research project on a specific theme (here \"Transition, transformation, conversion\"). My project was about [Terrain generation using Heightmaps] and various algorithms to generate heightmaps. If interested, click on the GitHub icon and/or the link to access the presentation (french).",
        themes: ["Python", "OCaml", "Heightmaps", "Perlin"],
        link: '/files/heightmapper_presentation.pdf',
        githubLink: 'https://github.com/gabriel-dahan/heightmapper'
    }
]
</script>

<template>
    <div class="flex flex-col gap-6">
        <h1 class="app__subtitle text-center">Projects</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mx-auto max-w-7xl">
            <ProjectCard 
                v-for="proj in projects" 
                :key="proj.title"
                :banner="proj.banner" 
                :title="proj.title" 
                :themes="proj.themes" 
                :description="proj.description" 
                :link="proj.link" 
                :githubLink="proj.githubLink"
            />
        </div>

        <hr class="h-px my-8 bg-neutral-400 border-0">

        <h1 class="app__subtitle text-center">Academic Projects</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mx-auto max-w-7xl">
            <ProjectCard 
                v-for="proj in academicProjects" 
                :key="proj.title"
                :banner="proj.banner" 
                :title="proj.title" 
                :themes="proj.themes" 
                :description="proj.description" 
                :link="proj.link" 
                :githubLink="proj.githubLink"
            />
        </div>
    </div>
</template>