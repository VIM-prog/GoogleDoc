<script setup lang="ts">
import headerApp from "@/layout/headerApp.vue";
import { googleSeacher } from "@/modules/google/";
import {useEmailStore} from "@/shared/store/email";
const emailStore = useEmailStore();
</script>
<template>
  <header-app></header-app>
  <google-seacher :email="emailStore.email"/>
</template>

<style scoped>

</style>
