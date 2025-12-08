export interface PersonItem {
  id: number
  nickname: string
  [key: string]: any
}
export interface ApplicationRecord {
  id: number
  appType: string
  lifeCycle: string
  timeZone: string
  language: string
  opsPerson: string
}
