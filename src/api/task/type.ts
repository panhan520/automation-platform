export type Interpreter = 'sh' | 'python'

export interface TaskRecord {
  id: number
  name: string
  number: string
  executeTime: string
  desc?: string
}
