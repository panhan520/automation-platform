import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { Menu } from '@/components/Menu'
import { Logo } from '@/components/Logo'
import AppView from './AppView.vue'
import { ElScrollbar } from 'element-plus'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('layout')

const appStore = useAppStore()

const pageLoading = computed(() => appStore.getPageLoading)

// 菜单折叠
const collapse = computed(() => appStore.getCollapse)

// logo
const logo = computed(() => appStore.logo)

// 是否是移动端
const mobile = computed(() => appStore.getMobile)

export const useRenderLayout = () => {
  const renderClassic = () => {
    return (
      <>
        <div
          class={[
            'absolute top-0 left-0 h-full layout-border__right',
            { '!fixed z-3000': mobile.value }
          ]}
        >
          {logo.value ? (
            <Logo
              class={[
                'bg-[var(--left-menu-bg-color)] relative',
                {
                  '!pl-0': mobile.value && collapse.value,
                  'w-[var(--left-menu-min-width)]': appStore.getCollapse,
                  'w-[var(--left-menu-max-width)]': !appStore.getCollapse
                }
              ]}
              style="transition: all var(--transition-time-02);"
            ></Logo>
          ) : undefined}
          <Menu></Menu>
        </div>
        <div
          class={[
            `${prefixCls}-content`,
            'absolute top-0 h-[100%]',
            {
              'w-[calc(100%-var(--left-menu-min-width))] left-[var(--left-menu-min-width)]':
                collapse.value && !mobile.value && !mobile.value,
              'w-[calc(100%-var(--left-menu-max-width))] left-[var(--left-menu-max-width)]':
                !collapse.value && !mobile.value && !mobile.value,
              'fixed !w-full !left-0': mobile.value
            }
          ]}
          style="transition: all var(--transition-time-02);"
        >
          <ElScrollbar v-loading={pageLoading.value} style="height:100vh !important;">
            <AppView></AppView>
          </ElScrollbar>
        </div>
      </>
    )
  }

  return {
    renderClassic
  }
}
