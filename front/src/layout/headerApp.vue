<script setup lang="ts">
import {computed, ref} from "vue";
import Btn from "@/components/base/btnBase.vue";
import Inp from "@/components/base/inpBase.vue";
import { useEmailStore } from "@/shared/store/email";
import { useTheme } from "vuetify";

const emailStore = useEmailStore();
const localEmail = ref(emailStore.email);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasError = computed(() => !emailRegex.test(localEmail.value) && localEmail.value !== '');
const errorMessage = computed(() => hasError.value ? "Неправильный email" : "");
const isButtonDisabled = computed(() => hasError.value || !localEmail.value);

const handleSubmit = () => {
  if (!isButtonDisabled.value) {
    emailStore.setEmail(localEmail.value);
  }
};

const theme = useTheme();
const switchTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
};
</script>

<template>
  <v-toolbar>
    <v-toolbar-title>uwu</v-toolbar-title>
    <v-spacer></v-spacer>
    <inp
      :model-value="localEmail"
      @update:model-value="localEmail = $event"
      class="flex-grow-1"
      type="email"
      :error="hasError"
      :error-messages="errorMessage"
    ></inp>
    <btn
      icon="mdi-magnify"
      :disabled="isButtonDisabled"
      @click="handleSubmit"
    ></btn>
    <btn
      icon="mdi-theme-light-dark"
      @click="switchTheme"
    ></btn>
  </v-toolbar>
</template>
