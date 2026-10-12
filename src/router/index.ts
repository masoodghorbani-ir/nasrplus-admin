import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: {
          requiresAuth: false,
          title: 'ورود به سامانه مدیریت',
        },
      },
    ],
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          requiresAuth: true,
          title: 'پیشخوان و آمار جامع',
        },
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/MembersView.vue'),
        meta: {
          requiresAuth: true,
          title: 'مدیریت اعضای صنف',
          permission: 'members:read',
        },
      },
      {
        path: 'companies',
        name: 'Companies',
        component: () => import('@/views/companies/CompaniesView.vue'),
        meta: {
          requiresAuth: true,
          title: 'مدیریت شرکت‌ها و اشخاص حقوقی',
          permission: 'companies:read',
        },
      },
      {
        path: 'lookups',
        name: 'Lookups',
        component: () => import('@/views/lookups/LookupsView.vue'),
        meta: {
          requiresAuth: true,
          title: 'اطلاعات پایه و تعاریف صنف',
          permission: 'lookups:read',
        },
      },
      {
        path: 'admins',
        name: 'Admins',
        component: () => import('@/views/admins/AdminsView.vue'),
        meta: {
          requiresAuth: true,
          title: 'مدیران و سطوح دسترسی',
          permission: 'admins:manage',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Update dynamic Persian document title
  const pageTitle = (to.meta?.title as string) || '';
  document.title = pageTitle
    ? `${pageTitle} | سامانه نصر پلاس`
    : 'سامانه نصر پلاس | سازمان نظام صنفی رایانه‌ای کشور';

  const requiresAuth = to.meta?.requiresAuth !== false;
  const token = localStorage.getItem('nasrplus_token');

  if (requiresAuth && !token) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else if (to.path === '/login' && token) {
    next('/dashboard');
  } else if (to.meta?.permission && !authStore.hasPermission(to.meta.permission as string)) {
    // If lacks permission, redirect to dashboard
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
