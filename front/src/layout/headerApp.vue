<script setup lang="ts">
import { ref, computed } from "vue";
import Btn from "@/components/base/btnBase.vue";
import Inp from "@/components/base/inpBase.vue";

const email = ref("");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasError = computed(() => !emailRegex.test(email.value) && email.value !== '');
const errorMessage = computed(() => hasError.value ? "Неправильный email" : "");
</script>

<template>
  <v-toolbar>
    <v-toolbar-title>Accesses</v-toolbar-title>
    <v-spacer></v-spacer>
    <inp
      v-model="email"
      class="flex-grow-1"
      type="email"
      :error="hasError"
      :error-messages="errorMessage"
    ></inp>
    <btn
      v-model="email"
      icon="mdi-magnify"
      :disabled="hasError || !email"
    ></btn>
  </v-toolbar>
</template>
