import {createRouter, createWebHistory} from "vue-router";
import ourFiles from "@/pages/ourFiles.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: ourFiles,
    },
  ]
})
