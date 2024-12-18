<template>
  <v-card class="mx-auto" color="surface-light">
    <v-text-field
      @update:model-value="$emit('update:modelValue', $event)"
      density="compact"
      label="Search templates"
      variant="solo"
      hide-details
      single-line
    ></v-text-field>
  </v-card>
</template>

<script setup lang="ts">
</script>
