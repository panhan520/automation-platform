import router from './router'
import { useAppStoreWithOut } from '@/store/modules/app'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { qiankunProps } from '@/main'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

router.beforeEach(async (to, from, next) => {
  start()
  loadStart()
  const permissionStore = usePermissionStoreWithOut()
  const appStore = useAppStoreWithOut()
  const userStore = useUserStoreWithOut()
  const isAuth = false

  // qiankun 子应用，从主应用传递 token 和用户信息
  if (window.__POWERED_BY_QIANKUN__ && !userStore.getToken) {
    // 尝试从 qiankun props 获取登录信息
    if (qiankunProps.token) {
      userStore.setToken(qiankunProps.token)
    }
    if (qiankunProps.userInfo) {
      userStore.setUserInfo(qiankunProps.userInfo)
    }
  }

  if (userStore.getUserInfo || !isAuth) {
    if (permissionStore.getIsAddRouters) {
      next()
      return
    }

    await permissionStore.generateRoutes('static')
    permissionStore.getAddRouters.forEach((route) => {
      router.addRoute(route as unknown as RouteRecordRaw)
    })
    const redirectPath = from.query.redirect || to.path
    const redirect = decodeURIComponent(redirectPath as string)
    const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect }
    permissionStore.setIsAddRouters(true)
    next(nextData)
  } else {
    next()
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
