<template>
  <el-dialog
    v-model="visible"
    title="添加用户"
    width="900"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="add-user-container">
      <!-- 左侧：选择用户 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">选择用户</span>
          <div class="header-actions">
            <el-button :icon="RefreshRight" circle @click="handleRefresh" />
            <el-button type="primary" :icon="Plus" @click="handleCreateUser"> 新建用户 </el-button>
          </div>
        </div>

        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名称"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="table-container">
          <el-table
            ref="tableRef"
            :data="userList"
            :loading="loading"
            @selection-change="handleSelectionChange"
            height="400"
            row-key="userId"
          >
            <el-table-column type="selection" width="55" :reserve-selection="true" />
            <el-table-column prop="userId" label="用户ID" width="100" />
            <el-table-column prop="username" label="用户名称" />
            <el-table-column prop="description" label="备注" />
            <template #empty>
              <div class="empty-state">
                <el-icon class="empty-icon"><DocumentAdd /></el-icon>
                <div class="empty-text">暂无数据</div>
              </div>
            </template>
          </el-table>
        </div>
      </div>

      <!-- 右侧：已选用户 -->
      <div class="right-panel">
        <div class="panel-header">
          <span class="selected-info">已选{{ selectedUsers.length }}/{{ maxSelect }}项</span>
          <div class="header-actions">
            <el-button :icon="RefreshRight" circle @click="handleRefresh" />
            <el-button type="primary" :icon="Plus" @click="handleCreateUser"> 新建用户 </el-button>
            <el-tooltip content="一键清空" placement="top">
              <el-button :icon="Delete" circle @click="handleClearAll" />
            </el-tooltip>
          </div>
        </div>

        <div class="selected-list">
          <div v-if="selectedUsers.length === 0" class="empty-selected">
            <div class="empty-text">暂无选中用户</div>
          </div>
          <div v-else class="selected-items">
            <div v-for="user in selectedUsers" :key="user.userId" class="selected-item">
              <span>{{ user.username }}</span>
              <el-icon class="remove-icon" @click="handleRemoveUser(user)">
                <Close />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ElTable } from 'element-plus'
import { RefreshRight, Plus, Delete, Search, Close, DocumentAdd } from '@element-plus/icons-vue'

interface UserItem {
  userId: string | number
  username: string
  description?: string
}

interface Props {
  visible: boolean
  maxSelect?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  maxSelect: 200,
  loading: false
})

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', users: UserItem[]): void
  (e: 'cancel'): void
  (e: 'refresh'): void
  (e: 'create-user'): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const tableRef = ref<InstanceType<typeof ElTable>>()
const userList = ref<UserItem[]>([])
const allUserList = ref<UserItem[]>([]) // 保存所有用户列表
const selectedUsers = ref<UserItem[]>([])
const searchKeyword = ref('')

// 监听 visible 变化，初始化数据
watch(
  () => props.visible,
  (val) => {
    if (val) {
      selectedUsers.value = []
      searchKeyword.value = ''
      emit('refresh')
    }
  }
)

// 监听搜索关键词，过滤用户列表
watch(searchKeyword, (keyword) => {
  if (!keyword) {
    userList.value = allUserList.value
  } else {
    userList.value = allUserList.value.filter((user) =>
      user.username.toLowerCase().includes(keyword.toLowerCase())
    )
  }
})

const handleSelectionChange = (selection: UserItem[]) => {
  selectedUsers.value = selection
}

const handleRemoveUser = (user: UserItem) => {
  const index = selectedUsers.value.findIndex((u) => u.userId === user.userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  }
  // 同时取消左侧表格的选中状态
  if (tableRef.value) {
    tableRef.value.toggleRowSelection(user, false)
  }
}

const handleClearAll = () => {
  selectedUsers.value = []
  // 清空表格选中状态
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

const handleSearch = () => {
  // 搜索功能已通过 watch 实现
}

const handleRefresh = () => {
  emit('refresh')
}

const handleCreateUser = () => {
  emit('create-user')
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleClose = () => {
  selectedUsers.value = []
  searchKeyword.value = ''
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm', selectedUsers.value)
  visible.value = false
}

// 暴露方法供父组件调用
defineExpose({
  setUserList: (users: UserItem[]) => {
    allUserList.value = users
    if (!searchKeyword.value) {
      userList.value = users
    } else {
      userList.value = users.filter((user) =>
        user.username.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    }
  },
  getSelectedUsers: () => selectedUsers.value
})
</script>

<style lang="less" scoped>
.add-user-container {
  display: flex;
  gap: 16px;
  height: 500px;

  .left-panel,
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;

    .panel-title {
      font-weight: 500;
      font-size: 14px;
      color: #303133;
    }

    .selected-info {
      font-size: 14px;
      color: #606266;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .search-bar {
    padding: 12px 16px;
    border-bottom: 1px solid #dcdfe6;
  }

  .table-container {
    flex: 1;
    overflow: hidden;
  }

  .selected-list {
    flex: 1;
    padding: 12px 16px;
    overflow-y: auto;

    .empty-selected {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #909399;
    }

    .selected-items {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .selected-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f5f7fa;
        border-radius: 4px;
        font-size: 14px;
        color: #303133;

        .remove-icon {
          cursor: pointer;
          color: #909399;
          font-size: 16px;

          &:hover {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
