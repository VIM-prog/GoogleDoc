<template>
  <v-card class="mx-auto my-8" max-width="600">
    <v-card-title>Файлы</v-card-title>
    <v-divider></v-divider>
    <v-list>
      <v-list-item v-for="doc in docs" :key="doc.id">
          <v-list-item-title>{{ doc.name }}</v-list-item-title>
        <v-list-item-subtitle class="grey--text">
          {{ doc.role }}
        </v-list-item-subtitle>
          <v-list-item-subtitle v-if="doc.path != doc.name" class="grey--text">
            {{ doc.path }}
          </v-list-item-subtitle>
        <template v-slot:prepend>
          <v-icon :icon=getFileIcon(doc.fileType)></v-icon>
        </template>
      </v-list-item>
    </v-list>
    <div v-if="docs.length === 0" class="text-center">
      Файлов нет
    </div>
  </v-card>
</template>

<script setup lang="ts">
import {onMounted, ref } from "vue";
import {getDocuments} from '@/modules/google/api/get';
import type { file } from "@/interface/file";
import {useEmailStore} from "@/shared/store/email";
const docs = ref<file[]>([]);
const emailStore = useEmailStore();
const email = ref(emailStore.email);

onMounted(async () => {
  try {
    const response = await getDocuments();
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
