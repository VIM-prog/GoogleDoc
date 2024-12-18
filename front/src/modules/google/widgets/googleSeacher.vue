<script setup lang="ts">
import { googleDocs, googleDrive } from "@/modules/google/components"
const props = defineProps(['email'])
</script>

<template>
  <google-drive :email="props.email" />
  <google-docs :email="props.email" />
</template>

<style scoped>

</style>
