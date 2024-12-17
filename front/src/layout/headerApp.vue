<script setup lang="ts">
import { computed } from "vue";
import Btn from "@/components/base/btnBase.vue";
import Inp from "@/components/base/inpBase.vue";
import { useEmailStore } from "@/shared/store/email";
import {useTheme} from "vuetify";
const emailStore = useEmailStore();
const email = computed({
  get: () => emailStore.email,
  set: (value) => {
    emailStore.email = value;
  },
});
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasError = computed(() => !emailRegex.test(email.value) && email.value !== '');
const errorMessage = computed(() => hasError.value ? "Неправильный email" : "");
const isButtonDisabled = computed(() => hasError.value || !email.value);

const handleSubmit = () => {
  if (!isButtonDisabled.value) {
    console.log("Email принят:", email.value);
  }
}
const theme = useTheme()
const switchTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>

<template>
  <v-toolbar>
    <v-toolbar-title>uwu</v-toolbar-title>
    <v-spacer></v-spacer>
    <inp
      v-model="email"
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
