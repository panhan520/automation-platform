export type Interpreter = 'sh' | 'python'

export interface TaskRecord {
  id: number
  name: string
  targets: string[]
  updated_at: string
  desc?: string
}
