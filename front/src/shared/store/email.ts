import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEmailStore = defineStore('email', () => {
  const email = ref('');

  return { email }
})
