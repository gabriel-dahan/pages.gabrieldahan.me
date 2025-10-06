<script setup>
import { onMounted } from 'vue';


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
            <a class="link link-hover">Contact</a>
            <a class="link link-hover">Projects</a>
            <a class="link link-hover">CV/Resume</a>
        </nav>
        <nav>
            <h6 class="footer-title">SOCIAL</h6>
            <a class="link link-hover" :href="githubLink" target="_blank">GitHub</a>
            <a class="link link-hover" :href="linkedinLink" target="_blank">LinkedIn</a>
        </nav>
    </footer>
</template>