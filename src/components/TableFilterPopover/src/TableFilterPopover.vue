<template>
  <el-popover :placement="placement" :width="width" trigger="click" v-model:visible="visible">
    <template #default>
      <slot name="content" :search="search" :reset="reset"></slot>
      <div class="radio-group-bottom">
        <el-button size="small" @click="reset">重置</el-button>
        <el-button size="small" type="primary" @click="search">确认</el-button>
      </div>
    </template>
    <template #reference>
      <div class="hover-filter">
        <el-icon class="cursor-pointer" :class="{ 'filter-icon': isFilter }">
          <Filter />
        </el-icon>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import type { Placement } from 'element-plus'
interface Props {
  placement?: Placement
  width?: number | string
  isFilter?: boolean
}

withDefaults(defineProps<Props>(), {
  placement: 'bottom-end',
  width: 300
})

const emit = defineEmits<{
  (e: 'search', callback?: (shouldClose?: boolean) => void): void
  (e: 'reset'): void
}>()

const visible = ref(false)

const search = async () => {
  emit('search', (shouldClose: boolean = true) => {
    if (shouldClose) {
      visible.value = false
    }
  })
  // emit('search')
  // visible.value = false
}

const reset = () => {
  emit('reset')
  visible.value = false
}
</script>

<style lang="less" scoped>
.radio-group-bottom {
  display: flex;
  justify-content: space-between;
  border-top: solid 1px #eaedf1;
  margin-top: 10px;
  padding-top: 10px;
}
.hover-filter {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  &:hover {
    background-color: rgba(26, 27, 30, 0.05);
  }
}

.filter-icon {
  color: rgb(22, 100, 255);
}
</style>
