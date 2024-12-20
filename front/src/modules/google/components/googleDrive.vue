<template>
  <p v-if="props.email">Поиск для {{props.email}}</p>
  <v-card class="mx-auto my-8" max-width="600">
    <v-card-title>Диски</v-card-title>
    <v-divider></v-divider>
    <v-list>
      <v-list-item v-for="drive in displayedDr" :key="drive.id">
        <v-list-item-title>{{ drive.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ drive.role }}</v-list-item-subtitle>
        <template v-slot:prepend>
          <v-icon icon="mdi-google-drive"></v-icon>
        </template>
        <template v-if="props.email" v-slot:append>
          <btn
            icon=$delete
            @click="async () => {
              await deleteDriveAccess(props.email, drive.id)
              await fetchDrives()
            }"
          >
          </btn>
        </template>
      </v-list-item>
    </v-list>
    <div v-if="loading == true" class="text-center my-8">
      <v-progress-circular
        indeterminate
        :width="3"
      ></v-progress-circular>
    </div>
    <div v-else-if="drives.length === 0" class="text-center">
      Дисков нет
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
import {computed, onMounted, ref, watch} from "vue";
import {getDrives, getDrivesWithEmail} from '@/modules/google/api/get';
import type {drive} from "@/modules/google/interface/drive";
import btn from "@/components/base/btnBase.vue";
import {deleteDriveAccess} from "@/modules/google/api/delete";
const props = defineProps(['email'])
const drives = ref<drive[]>([]);

const loading = ref<boolean>(true);
const page = ref(1);
const itemsPerPage = 10;

const fetchDrives = async () => {
  loading.value = true;
  try {
    const response = props.email ? await getDrivesWithEmail(props.email) : await getDrives();
    drives.value = response.data;
  } catch (error) {
    console.error('Провал загрузки дисков:', error);
  } finally {
    loading.value = false;
  }
};

watch(
  () =>props.email,
  async () => {
    drives.value = []
    page.value = 1;
    await fetchDrives();
  },
  { immediate: true }
);

const pageCount = computed(() => Math.ceil(drives.value.length / itemsPerPage));

const displayedDr = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return drives.value.slice(start, end);
});
watch(page, () => {
  window.scrollTo(0, 0);
});

onMounted(fetchDrives);
</script>

<style scoped>
p{
  text-align: center;
  margin: 10px;
  font-size: 20px;
}
</style>

<style scoped>
p{
  text-align: center;
  margin: 10px;
  font-size: 20px;

}
</style>
