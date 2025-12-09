export interface ExecutionRecord {
  id: number
  name: string
  task_id: string
  interpreter: string
  run_time: string
  status: 0 | 1 | 2
}
