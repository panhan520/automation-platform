import request from '@/axios'
import { CertsList, CertsParams, CreateCertificate, DeleteCertificate } from './type'
// 获取证书列表
export const apiGetCertsList = (data: CertsParams): Promise<IPaginationResponse<CertsList>> => {
  return request.get({ url: '/apis/v1/certs', params: data })
}
// 创建证书
export const apiCreateCert = (data: CreateCertificate): Promise<IPaginationResponse<CertsList>> => {
  return request.post({ url: '/apis/v1/certs', data })
}
// 删除证书
export const apiDeleteCert = (data: DeleteCertificate): Promise<IPaginationResponse<CertsList>> => {
  return request.delete({ url: `/apis/v1/certs/${data.certId}` })
}
// 证书状态统计
export const apiGetCertTotal = () => {
  return request.get({ url: '/apis/v1/certs/total' })
}
// 更新证书
export const apiUpdateCert = (data: any): Promise<IPaginationResponse<CertsList>> => {
  const { certId } = data
  delete data.certId
  return request.put({ url: `/apis/v1/certs/${certId}`, data })
}
