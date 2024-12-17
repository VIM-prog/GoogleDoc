<template>
  <v-card class="mx-auto my-8" max-width="600">
    <v-card-title>Диски</v-card-title>
    <v-divider></v-divider>
    <v-list >
      <v-list-item v-for="drive in drives" :key="drive.id">
        <v-list-item-title>{{ drive.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ drive.role }}</v-list-item-subtitle>
        <template v-slot:prepend>
          <v-icon icon="mdi-google-drive"></v-icon>
        </template>
      </v-list-item>
    </v-list>
    <div v-if="drives.length === 0" class="text-center">
      Дисков нет
    </div>
  </v-card>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {getDrives} from '@/modules/google/api/get';
import type {drive} from "@/interface/drive";

const drives = ref<drive[]>([]);


onMounted(async () => {
  try {
    const response = await getDrives();
    drives.value = response.data;
  } catch (error) {
    console.error('Провал загрузки дисков:', error);
  }
})
</script>

<style scoped>

</style>
