export interface UserCreateRequest {
  username: string
  password: string
  phone?: string
  email?: string
  roleIds?: number[]
}

export interface UserUpdateRequest {
  phone?: string
  email?: string
  realName?: string
  gender?: string
  birthday?: string
  avatar?: string
}

export interface UserSearchRequest {
  username?: string
  phone?: string
  email?: string
  status?: string
}

export interface ChangePasswordRequest {
  oldPassword?: string
  newPassword: string
}

export interface SendMessageRequest {
  receiverId: number
  content: string
}

export interface UserExportRequest {
  fields?: string[]
  fileName?: string
  status?: number
}
