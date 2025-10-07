<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';


const currentYear = new Date().getFullYear();

const githubLink = 'https://github.com/gabriel-dahan';
const linkedinLink = 'https://www.linkedin.com/in/gabriel-dahan-964b59371/en/';

</script>

<template>
    <footer class="footer sm:footer-horizontal bg-base-200 text-neutral-content p-10">
        <div>
            <p>Gabriel Dahan - {{ currentYear }}</p>
            <small>Any bug/issue ? Contact me !</small>
        </div>
        <nav>
            <h6 class="footer-title">LINKS</h6>
            <RouterLink class="link link-hover" to="/contact">Contact</RouterLink>
            <RouterLink class="link link-hover" to="/projects">Projects</RouterLink>
            <RouterLink class="link link-hover" to="/resume">CV/Resume</RouterLink>
        </nav>
        <nav>
            <h6 class="footer-title">SOCIAL</h6>
            <a class="link link-hover" :href="githubLink" target="_blank">GitHub</a>
            <a class="link link-hover" :href="linkedinLink" target="_blank">LinkedIn</a>
        </nav>
    </footer>
</template>