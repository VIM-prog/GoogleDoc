<template>
  <v-card class="mx-auto" color="surface-light">
    <v-text-field
      :model-value="modelValue"
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
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: String,
});
const emit = defineEmits(['update:modelValue']);
</script>
