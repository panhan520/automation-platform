import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout } from '@/utils/routerHelper'
import { NO_RESET_WHITE_LIST } from '@/constants'

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/applicationManagement/index',
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
    path: '/applicationManagement',
    component: Layout,
    name: 'ApplicationManagement',
    meta: {
      title: '应用管理',
      icon: 'vi-ep:document'
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/applicationManagement/index.vue'),
        name: 'ApplicationManagementList',
        meta: {
          title: '应用管理',
          icon: 'vi-ep:document'
        }
      }
    ]
  },
  {
    path: '/nodeManagement',
    component: Layout,
    redirect: '/nodeManagement/index',
    name: 'NodeManagement',
    meta: {
      title: '节点管理',
      icon: 'vi-ep:lightning',
      alwaysShow: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/nodeManagement/index.vue'),
        name: 'NodeManagementList',
        meta: {
          title: '节点管理'
        }
      },
      {
        path: 'executionHistory',
        component: () => import('@/views/nodeManagement/executionHistory/index.vue'),
        name: 'NodeExecutionHistory',
        meta: {
          title: '执行历史'
        }
      },
      {
        path: 'executionHistory/:taskId',
        component: () => import('@/views/nodeManagement/executionHistory/detail.vue'),
        name: 'NodeExecutionHistoryDetail',
        meta: {
          title: '执行详情',
          hidden: true,
          activeMenu: '/nodeManagement/executionHistory',
          noTagsView: true
        }
      }
    ]
  },
  {
    path: '/automationManagement',
    component: Layout,
    redirect: '/automationManagement/template',
    name: 'AutomationManagement',
    meta: {
      title: '自动化管理',
      icon: 'vi-ep:setting',
      alwaysShow: true
    },
    children: [
      {
        path: 'template',
        component: () => import('@/views/automationManagement/template/index.vue'),
        name: 'TemplateManagement',
        meta: {
          title: '模板管理'
        }
      },
      {
        path: 'quickExecution',
        component: () => import('@/views/automationManagement/quickExecution/index.vue'),
        name: 'QuickExecution',
        meta: {
          title: '快速执行'
        }
      },
      {
        path: 'task',
        component: () => import('@/views/automationManagement/task/index.vue'),
        name: 'TaskManagement',
        meta: {
          title: '任务管理'
        }
      },
      {
        path: 'executionHistory',
        component: () => import('@/views/automationManagement/executionHistory/index.vue'),
        name: 'AutomationExecutionHistory',
        meta: {
          title: '执行历史'
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
