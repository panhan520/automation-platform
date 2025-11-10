<template>
  <ContentWrap>
    <div class="page-title">快速执行</div>
    <div class="quick-execution-content">
      <el-card>
        <template #header>
          <div class="card-header">快速执行任务</div>
        </template>
        <el-form :model="form" label-width="120px">
          <el-form-item label="选择模版" required>
            <el-select v-model="form.templateId" placeholder="请选择模版" style="width: 100%">
              <el-option label="模版1" value="1" />
              <el-option label="模版2" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标主机" required>
            <el-button type="primary" link>选择主机</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleExecute">执行</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'

const form = ref({
  templateId: '',
  hostIds: []
})

const handleExecute = () => {
  ElMessage.success('执行成功')
}

const handleReset = () => {
  form.value = {
    templateId: '',
    hostIds: []
  }
}
</script>

<style lang="less" scoped>
.page-title {
  font-size: 18px;
  line-height: 26px;
  color: #0c0d0e;
  margin-bottom: 20px;
  text-align: left;
}

.quick-execution-content {
  margin-top: 20px;
}

.card-header {
  font-weight: 500;
}
</style>
