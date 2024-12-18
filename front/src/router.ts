import {createRouter, createWebHistory} from "vue-router";
import searcher from "@/pages/searcher.vue";
import notFound from "@/layout/errors/notFound.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: searcher,
    },
    {
      path: '/:pathMatch(.*)*',
      component: notFound
    }
  ]
})
