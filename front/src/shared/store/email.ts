import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useEmailStore = defineStore('email', () => {
  const email = ref('');

  function setEmail( newEmail: string): void {
    email.value = newEmail
  }
  return { email, setEmail }
})
