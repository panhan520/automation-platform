import { AxiosResponse, InternalAxiosRequestConfig } from './types'
import { ElMessage } from 'element-plus'
import qs from 'qs'
import { SUCCESS_CODE, TRANSFORM_REQUEST_DATA } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { objToFormData } from '@/utils'
// import { getToken } from '@/utils/auth'

const defaultRequestInterceptors = (config: InternalAxiosRequestConfig) => {
  if (
    config.method === 'post' &&
    config.headers['Content-Type'] === 'application/x-www-form-urlencoded'
  ) {
    config.data = qs.stringify(config.data)
  } else if (
    TRANSFORM_REQUEST_DATA &&
    config.method === 'post' &&
    config.headers['Content-Type'] === 'multipart/form-data' &&
    !(config.data instanceof FormData)
  ) {
    config.data = objToFormData(config.data)
  }
  const userStore = useUserStoreWithOut()
  const token = userStore.userInfo?.token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  if (config.method === 'get' && config.params) {
    let url = config.url as string
    url += '?'
    const keys = Object.keys(config.params)
    for (const key of keys) {
      if (config.params[key] !== void 0 && config.params[key] !== null) {
        const value = config.params[key]
        if (Array.isArray(value)) {
          // 处理数组参数，使用 qs.stringify 序列化，arrayFormat: 'repeat' 表示 tags=value1&tags=value2
          if (value.length > 0) {
            const arrayParams = { [key]: value }
            const serialized = qs.stringify(arrayParams, { arrayFormat: 'repeat' })
            if (serialized) {
              url += serialized + '&'
            }
          }
        } else {
          url += `${key}=${encodeURIComponent(value)}&`
        }
      }
    }
    url = url.substring(0, url.length - 1)
    config.params = {}
    config.url = url
  }
  return config
}

const defaultResponseInterceptors = (response: AxiosResponse) => {
  if (response?.config?.responseType === 'blob') {
    // 如果是文件流，直接过
    return response
  } else if (response.data.code === SUCCESS_CODE) {
    return response.data
  } else {
    ElMessage.error(response?.data?.message)
    if (response?.data?.code === 401 || response?.data?.code === 403) {
      const userStore = useUserStoreWithOut()
      userStore.resetApp?.()
    }
    return Promise.reject(new Error(response?.data?.message || 'Error'))
  }
}

const defaultResponseInterceptorsCatch = (error: any) => {
  console.log('err： ' + error) // for debug

  if (error.response) {
    // 服务器返回了错误状态码（如 400, 404, 500 等）
    const { status, data } = error.response
    const errorMessage = data?.message || data?.error || `请求失败 (${status})`

    ElMessage.error(errorMessage)

    // 处理 401 未授权错误
    if (status === 401 || status === 403) {
      const userStore = useUserStoreWithOut()
      userStore.resetApp?.()
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    ElMessage.error('网络错误，请检查您的网络连接')
  } else {
    // 其他错误
    ElMessage.error(error.message || '请求失败')
  }

  return Promise.reject(error)
}

export { defaultResponseInterceptors, defaultResponseInterceptorsCatch, defaultRequestInterceptors }
