<template>
  <v-card class="mx-auto my-8" max-width="600">
    <v-card-title>Файлы</v-card-title>
    <v-divider></v-divider>
    <v-list>
      <v-list-item v-for="doc in displayedDocs" :key="doc.id">
        <v-list-item-title>{{ doc.name }}</v-list-item-title>
        <v-list-item-subtitle v-if="doc.role" class="grey--text">
          {{ doc.role }}
        </v-list-item-subtitle>
        <v-list-item-subtitle v-else class="grey--text">
          reader or commenter
        </v-list-item-subtitle>
        <v-list-item-subtitle v-if="doc.path != doc.name" class="grey--text">
          {{ doc.path }}
        </v-list-item-subtitle>
        <template v-slot:prepend>
          <v-icon :icon="getFileIcon(doc.fileType)"></v-icon>
        </template>
        <template v-slot:append>
          <btn v-if="props.email"
               icon="$delete"
               @click="async () => {
                 docs = []
                 await fetchDocuments();
                try {
                  await deleteDocsAccess(props.email, doc.id);
                } catch {
                  console.log('us')
                  showAlert();
                }
              }"
          ></btn>
        </template>
      </v-list-item>
    </v-list>
    <div v-if="loading" class="text-center my-8">
      <v-progress-circular indeterminate :width="3"></v-progress-circular>
    </div>
    <div v-else-if="docs.length === 0" class="text-center">
      Файлов нет
    </div>
    <v-pagination
      v-model="page"
      :length="pageCount"
      circle
      class="mt-4"
    ></v-pagination>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getDocuments, getDocumentsWithEmail } from "@/modules/google/api/get";
import type { file } from "@/modules/google/interface/file";
import btn from "@/components/base/btnBase.vue";
import { deleteDocsAccess } from "@/modules/google/api/delete";
const docs = ref<file[]>([]);
const props = defineProps(['email']);
const showAlert = () => { alert('Это разрешение является наследованным'); };
const loading = ref<boolean>(true);
const page = ref(1);
const itemsPerPage = 10;
const fetchDocuments = async () => {
  loading.value = true;
  try {
    const response = props.email ? await getDocumentsWithEmail(props.email) : await getDocuments();
    docs.value = response.data;
  } catch (error) {
    console.error("Ошибка при загрузке файлов:", error);
  } finally {
    loading.value = false;
  }
};
watch(
  () => props.email,
  async () => {
    docs.value = [];
    page.value = 1;
    await fetchDocuments();
  },
  { immediate: true }
);
onMounted(fetchDocuments);
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "folder":
      return "mdi-folder";
    case "document":
      return "mdi-file-document";
    case "image":
      return "mdi-image";
    case "video":
      return "mdi-video";
    case "pdf":
      return "mdi-book";
    case "zip":
      return "mdi-zip-box";
    case "powerpoint":
      return "mdi-file-powerpoint";
    case "excel":
      return "mdi-file-excel";
    default:
      return "mdi-file";
  }
};
const pageCount = computed(() => Math.ceil(docs.value.length / itemsPerPage));

const displayedDocs = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return docs.value.slice(start, end);
});
watch(page, () => {
  window.scrollTo(0, 0);
});
</script>
