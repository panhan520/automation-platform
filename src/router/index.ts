import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
import { NO_RESET_WHITE_LIST } from '@/constants'

const { t } = useI18n()

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/userManagement',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectWrap',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  }
  // {
  //   path: '/404',
  //   component: () => import('@/views/Error/404.vue'),
  //   name: 'NoFind',
  //   meta: {
  //     hidden: true,
  //     title: '404',
  //     noTagsView: true
  //   }
  // }
]

export const asyncRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/userManagement',
    component: Layout,
    redirect: '/userManagement/user',
    name: 'UserManagement',
    meta: {
      title: '用户管理',
      icon: 'vi-ep:user',
      alwaysShow: true
    },
    children: [
      {
        path: 'user',
        component: () => import('@/views/userManagement/user/index.vue'),
        name: 'User',
        meta: {
          title: '用户'
        }
      },
      {
        path: 'userGroup',
        component: () => import('@/views/userManagement/userGroup/index.vue'),
        name: 'UserGroup',
        meta: {
          title: '用户组'
        }
      }
    ]
  },
  {
    path: '/roleManagement',
    component: Layout,
    name: 'RoleManagement',
    meta: {
      title: '角色管理',
      icon: 'vi-ep:key'
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/roleManagement/index.vue'),
        name: 'RoleManagementList',
        meta: {
          title: '角色管理',
          icon: 'vi-ep:key'
        }
      }
    ]
  },
  {
    path: '/permissionManagement',
    component: Layout,
    name: 'PermissionManagement',
    meta: {
      title: '权限管理',
      icon: 'vi-ep:lock'
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/permissionManagement/index.vue'),
        name: 'PermissionManagementList',
        meta: {
          title: '权限管理',
          icon: 'vi-ep:lock'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: constantRouterMap as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
