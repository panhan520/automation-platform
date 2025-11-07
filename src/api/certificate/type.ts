export interface CertsParams {
  subjectKeyword?: string
  nameKeyword?: string
  tags: Array<string>
  status: string
  page: number
  pageSize: number
}

export interface CertsList {
  id: number | string
  name: string
  subjectNames: Array<string>
  tags: Array<string>
  issuer: string
  status: string
  serial: string
  notAfter: string
  notBefore: string
  sha256Fingerprint: string
  certificatePem: string
  algorithm: string
  privateKeyPem: string
  createdAt: string
  updatedAt: string
}

export interface CreateCertificate {
  name: string
  certificatePem: string
  privateKeyPem: string
  tags: string[]
  allowDuplicate: boolean
  disableIntegrityCheck: boolean
}

export interface DeleteCertificate {
  certId: string
}
