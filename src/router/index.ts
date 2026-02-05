import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store";

const Login = () => import("@/pages/Login.vue");
const MainLayout = () => import("@/layout/MainLayout.vue");
const Upload = () => import("@/pages/Upload.vue");
const Dashboard = () => import("@/pages/Dashboard.vue");

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: Login },
    {
      path: "/",
      component: MainLayout,
      redirect: "/dashboard",
      children: [
        { path: "dashboard", component: Dashboard },
        { path: "upload", component: Upload }
      ]
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.path !== "/login" && !auth.isAuthed) return "/login";
  if (to.path === "/login" && auth.isAuthed) return "/dashboard";
  return true;
});

export default router;
