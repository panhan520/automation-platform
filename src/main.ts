import 'vue/jsx'

import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

// 引入windi css
import '@/plugins/unocss'

// 导入全局的svg图标
import '@/plugins/svgIcon'

// 初始化多语言
import { setupI18n } from '@/plugins/vueI18n'

// 引入状态管理
import { setupStore } from '@/store'

// 全局组件
import { setupGlobCom } from '@/components'

// 引入element-plus
import { setupElementPlus } from '@/plugins/elementPlus'

// 引入全局样式
import '@/styles/index.less'

// 引入动画
import '@/plugins/animate.css'

// 路由
import { setupRouter } from './router'

// 权限
import { setupPermission } from './directives'

import { createApp } from 'vue'

import App from './App.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import './permission'
import { useUserStore } from '@/store/modules/user'
let app: any = null

// qiankun props 全局存储
export let qiankunProps: QiankunProps = {}

// 创建实例
async function render(props: QiankunProps = {}) {
  app = createApp(App)

  // 存储 qiankun props，供其他地方使用
  qiankunProps = props

  await setupI18n(app)
  setupStore(app)
  setupGlobCom(app)
  setupElementPlus(app)
  setupRouter(app)
  setupPermission(app)
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  // qiankun 下，容器要挂到 props.container 内部
  app.mount(props.container ? props.container.querySelector('#app') : '#app')
}
// 独立运行时，直接执行 render()
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}

// ✅ qiankun 生命周期钩子
renderWithQiankun({
  bootstrap() {
    console.log('子应用 bootstrap')
  },
  mount(props) {
    console.log('子应用 mount', props)
    render(props)
    const authStore = useUserStore()
    props.onGlobalStateChange((state: any) => {
      console.log('子应用接收到的全局状态：', state)
      authStore.userInfo = state.userInfo
      authStore.resetApp = state.resetApp
    }, true)
  },
  unmount() {
    console.log('子应用 unmount')
    if (app) {
      app.unmount()
      app = null
    }
  },
  update(props) {
    console.log('子应用 update', props)
  }
})
