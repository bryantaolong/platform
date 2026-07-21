import { useNavigate } from 'react-router-dom';
import { Card, Avatar, Empty } from '@arco-design/web-react';
import { getAvatarUrl } from '@/utils/file';
import type { UserProfileVO } from '@/models/vo/user';

interface UserListProps {
  users: UserProfileVO[];
  onClose: () => void;
}

const UserList: React.FC<UserListProps> = ({ users, onClose }) => {
  const navigate = useNavigate();

  const goToUserProfile = (userId: number) => {
    navigate(`/user/${userId}`);
    onClose();
  };

  if (users.length === 0) {
    return <Empty description="暂无用户" />;
  }

  return (
    <div className="user-list">
      <div className="users-grid">
        {users.map((user) => (
          <Card
            key={user.userId}
            className="user-card"
            hoverable
            onClick={() => goToUserProfile(user.userId)}
          >
            <div className="user-info">
              <Avatar size={40}>
                <img src={getAvatarUrl(user.avatar)} alt="" />
                {user.username?.charAt(0).toUpperCase()}
              </Avatar>
              <div className="user-text">
                <div className="user-name">{user.username}</div>
                {user.realName && (
                  <div className="user-real-name">{user.realName}</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserList;
