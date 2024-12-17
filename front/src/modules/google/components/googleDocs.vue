<template>
  <v-card class="mx-auto my-8" max-width="600">
    <v-card-title>Файлы</v-card-title>
    <v-divider></v-divider>
    <v-list>
      <v-list-item v-for="file in docs" :key="file.id">
          <v-list-item-title>{{ file.name }}</v-list-item-title>
          <v-list-item-subtitle class="grey--text">
            {{ file.fileType }}
          </v-list-item-subtitle>
          <v-list-item-subtitle class="grey--text">
            Путь: {{ file.path }}
          </v-list-item-subtitle>
        <template v-slot:prepend>
          <v-icon :icon=getFileIcon(file.fileType)></v-icon>
        </template>
      </v-list-item>
    </v-list>
    <div v-if="docs.length === 0" class="text-center">
      Файлов нет
    </div>
  </v-card>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import docsRequest from '@/modules/google/api/getDocs';
import type { file } from "@/interface/file";

const docs = ref<file[]>([]);

onMounted(async () => {
  try {
    const response = await docsRequest;
    docs.value = response.data;
  } catch (error) {
    console.error('Провал загрузки файлов:', error);
  }
});

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'folder':
      return 'mdi-folder';
    case 'document':
      return 'mdi-file-document';
    case 'image':
      return 'mdi-image';
    case 'video':
      return 'mdi-video';
    case 'pdf':
      return 'mdi-file-pdf';
    case 'zip':
      return 'mdi-zip-box';
    case 'powerpoint':
      return 'mdi-file-powerpoint';
    case 'excel':
      return 'mdi-file-excel';
    default:
      return 'mdi-file';
  }
}
</script>

<style scoped>

</style>
