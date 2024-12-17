import {createRouter, createWebHistory} from "vue-router";
import ourFiles from "@/pages/ourFiles.vue";
import notFound from "@/layout/errors/notFound.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: ourFiles,
    },
    {
      path: '/:pathMatch(.*)*',
      component: notFound
    }
  ]
})
