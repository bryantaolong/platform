import { Space, Button, Table, Dropdown, Menu, Pagination } from '@arco-design/web-react'
import { IconEdit, IconEye, IconLock, IconUnlock, IconDelete, IconArrowDown } from '@arco-design/web-react/icon'
import type { TableColumnProps as ColumnProps } from '@arco-design/web-react'
import type { SysUser } from '@/models/entity/user'
import { formatDateTime, getStatusTag, getRoleTag } from './helper'

interface UserTableProps {
  loading: boolean
  data: SysUser[]
  total: number
  pageNum: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (user: SysUser) => void
  onView: (user: SysUser) => void
  onResetPassword: (user: SysUser) => void
  onBlock: (user: SysUser) => void
  onUnblock: (user: SysUser) => void
  onDelete: (user: SysUser) => void
}

const UserTable: React.FC<UserTableProps> = ({
  loading,
  data,
  total,
  pageNum,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onView,
  onResetPassword,
  onBlock,
  onUnblock,
  onDelete,
}) => {
  const columns: ColumnProps[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      minWidth: 120,
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 140,
      align: 'center',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      minWidth: 180,
      ellipsis: true,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 140,
      align: 'center',
      render: (_: string, record: SysUser) => getRoleTag(record.roles),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (_: string, record: SysUser) => getStatusTag(record.status),
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginAt',
      width: 180,
      align: 'center',
      render: (_: string, record: SysUser) => formatDateTime(record.lastLoginAt),
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right' as const,
      align: 'center',
      render: (_: unknown, record: SysUser) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<IconEdit />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Dropdown
            droplist={
              <Menu onClickMenuItem={(command: string) => {
                switch (command) {
                  case 'view':
                    onView(record)
                    break
                  case 'resetPwd':
                    onResetPassword(record)
                    break
                  case 'block':
                    onBlock(record)
                    break
                  case 'unblock':
                    onUnblock(record)
                    break
                  case 'delete':
                    onDelete(record)
                    break
                }
              }}>
                <Menu.Item key="view">
                  <IconEye /> 查看详情
                </Menu.Item>
                <Menu.Item key="resetPwd">
                  <IconLock /> 重置密码
                </Menu.Item>
                {record.status !== 'BANNED' ? (
                  <Menu.Item key="block">
                    <IconLock /> 封禁用户
                  </Menu.Item>
                ) : (
                  <Menu.Item key="unblock">
                    <IconUnlock /> 解封用户
                  </Menu.Item>
                )}
                <Menu.Item key="delete" className="danger-action">
                  <IconDelete /> 删除用户
                </Menu.Item>
              </Menu>
            }
            trigger="click"
          >
            <Button size="small" type="primary">
              更多 <IconArrowDown />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ]

  return (
    <div className="table-container">
      <Table
        loading={loading}
        columns={columns}
        data={data}
        rowKey="id"
        border
        stripe
        pagination={false}
        scroll={{ x: 1200 }}
      />
      <div className="pagination-container">
        <Pagination
          current={pageNum}
          pageSize={pageSize}
          total={total}
          sizeOptions={[10, 20, 50, 100]}
          showTotal
          sizeCanChange
          onChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  )
}

export default UserTable
