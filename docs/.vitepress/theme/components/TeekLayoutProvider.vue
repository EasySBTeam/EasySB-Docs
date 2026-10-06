<script setup lang="ts" name="TeekLayoutProvider">
import Teek, { en, zhCn } from "vitepress-theme-teek";
import { useData } from "vitepress";
import { computed } from "vue";

// Teek's own strings follow the active VitePress locale.
const { lang } = useData();
const locale = computed(() => (lang.value.startsWith("zh") ? zhCn : en));
</script>

<template>
  <Teek.Layout :locale />
</template>
