import { defineStore } from 'pinia'
import type { Task } from '@/components/TaskDetailPanel'

interface TaskPanelState {
  visible: boolean
  tasks: Task[]
  pulseSignal: number
}

export const useTaskPanelStore = defineStore('taskPanel', {
  state: (): TaskPanelState => {
    return {
      visible: false,
      tasks: [],
      pulseSignal: 0
    }
  },
  getters: {
    getVisible(): boolean {
      return this.visible
    },
    getTasks(): Task[] {
      return this.tasks
    },
    getPulseSignal(): number {
      return this.pulseSignal
    }
  },
  actions: {
    setVisible(visible: boolean) {
      this.visible = visible
    },
    setTasks(tasks: Task[]) {
      this.tasks = tasks
    },
    addTask(task: Task) {
      this.tasks.unshift(task)
    },
    updateTask(taskId: string, updates: Partial<Task>) {
      const index = this.tasks.findIndex((t) => t.id === taskId)
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates }
      }
    },
    triggerPulse() {
      this.pulseSignal = Date.now()
    }
  },
  persist: true
})

