import { Table, Tag } from '@arco-design/web-react';
import { isIPv6 } from '@/utils/ipLocation';

export interface LoginHistoryItem {
  loginTime: string;
  ipAddress: string;
  location?: string;
  device: string;
}

interface LoginHistoryProps {
  history: LoginHistoryItem[];
}

const LoginHistory: React.FC<LoginHistoryProps> = ({ history }) => {
  const columns = [
    { title: '登录时间', dataIndex: 'loginTime', width: 180 },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      width: 220,
      render: (_: any, record: LoginHistoryItem) => (
        <div className="ip-info">
          <span>{record.ipAddress}</span>
          {record.ipAddress && record.ipAddress !== 'Unknown' && (
            <Tag
              color={isIPv6(record.ipAddress) ? 'green' : 'arcoblue'}
              size="small"
              style={{ marginLeft: 8 }}
            >
              {isIPv6(record.ipAddress) ? 'IPv6' : 'IPv4'}
            </Tag>
          )}
        </div>
      ),
    },
    { title: '登录地点', dataIndex: 'location' },
    { title: '设备信息', dataIndex: 'device' },
  ];

  return <Table columns={columns} data={history} rowKey="loginTime" pagination={false} />;
};

export default LoginHistory;
