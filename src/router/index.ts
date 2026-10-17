import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const routes: RouteRecordRaw[] = [
  // 1. Root Landing Page: Two main options (Admin vs Member Profile)
  {
    path: '/',
    name: 'HomeLanding',
    component: () => import('@/views/home/HomeLandingView.vue'),
    meta: {
      requiresAuth: false,
      title: 'درگاه خدمات الکترونیک نصر پلاس',
    },
  },

  // 2. Member Profile Portal
  {
    path: '/profile',
    name: 'MemberProfile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: {
      requiresAuth: false,
      title: 'پروفایل اعضا',
    },
  },

  // 3. Public Member Registration & Landing
  {
    path: '/register',
    name: 'MemberRegister',
    component: () => import('@/views/public/LandingView.vue'),
    meta: {
      requiresAuth: false,
      title: 'سامانه ثبت‌نام آنلاین اعضای صنف',
    },
  },
  {
    path: '/landing',
    name: 'PublicLanding',
    component: () => import('@/views/public/LandingView.vue'),
    meta: {
      requiresAuth: false,
      title: 'پورتال جامع عضویت الکترونیک نظام صنفی رایانه‌ای',
    },
  },
  {
    path: '/portal',
    redirect: '/register',
  },
  {
    path: '/join',
    redirect: '/register',
  },

  // 4. Admin Authentication
  {
    path: '/admin/login',
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
    path: '/login',
    redirect: '/admin/login',
  },

  // 5. Complete Admin Management System (/admin)
  {
    path: '/admin',
    component: AppLayout,
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          requiresAuth: true,
          title: 'داشبورد مدیریت',
        },
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/MembersView.vue'),
        meta: {
          requiresAuth: true,
          title: 'مدیریت اعضا',
          permission: 'members:read',
        },
      },
      {
        path: 'members/import',
        name: 'MemberImport',
        component: () => import('@/views/members/MemberImportView.vue'),
        meta: {
          requiresAuth: true,
          title: 'ورود اعضا از اکسل',
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

  // 6. Legacy Route Redirects to /admin
  {
    path: '/dashboard',
    redirect: '/admin/dashboard',
  },
  {
    path: '/members',
    redirect: '/admin/members',
  },
  {
    path: '/companies',
    redirect: '/admin/companies',
  },
  {
    path: '/lookups',
    redirect: '/admin/lookups',
  },
  {
    path: '/admins',
    redirect: '/admin/admins',
  },

  // 7. Fallback Catch-all Route
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      if (to.path.startsWith('/admin')) {
        return '/admin/dashboard';
      }
      return '/';
    },
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
    : 'سامانه نصر پلاس | سازمان نظام صنفی رایانه‌ای اردبیل';

  const requiresAuth = to.meta?.requiresAuth !== false;
  const token = localStorage.getItem('nasrplus_token');

  if (requiresAuth && !token) {
    next({
      path: '/admin/login',
      query: { redirect: to.fullPath },
    });
  } else if ((to.path === '/login' || to.path === '/admin/login') && token) {
    next('/admin/dashboard');
  } else if (to.meta?.permission && !authStore.hasPermission(to.meta.permission as string)) {
    // If lacks permission, redirect to admin dashboard
    next('/admin/dashboard');
  } else {
    next();
  }
});

export default router;
