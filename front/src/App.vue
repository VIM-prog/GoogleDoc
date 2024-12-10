<template>
  <layout-header></layout-header>
  <search></search>
  <delete-access></delete-access>
</template>

<script setup lang="ts">
import search from "@/components/base/search.vue";
import DeleteAccess from "@/components/base/deleteAccess.vue";
import LayoutHeader from "@/shared/layout/LayoutHeader.vue";
</script>
