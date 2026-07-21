import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Tabs,
  Modal,
  Upload,
  Message,
  Input,
  Empty,
} from '@arco-design/web-react';
import { IconCamera } from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import * as userApi from '@/api/user/user';
import * as userProfileApi from '@/api/user/userProfile';
import * as userFollowApi from '@/api/user/userFollow';
import { getAvatarUrl } from '@/utils/file';
import { getLocationFromIp } from '@/utils/ipLocation';
import type { UserProfileVO } from '@/models/vo/user';
import type { SecuritySettingsRef } from '@/components/profile/SecuritySettings';
import MyPosts from '@/components/profile/MyPosts';
import UserCollectList from '@/components/profile/UserCollectList';
import BasicInfo from '@/components/profile/BasicInfo';
import SecuritySettings from '@/components/profile/SecuritySettings';
import LoginHistory from '@/components/profile/LoginHistory';
import type { LoginHistoryItem } from '@/components/profile/LoginHistory';
import './UserProfile.css';

/* --- Utility helpers --- */
function genderToNum(g?: string): 1 | 0 {
  return g === 'FEMALE' ? 0 : 1;
}

function numToGender(n: 1 | 0): 'MALE' | 'FEMALE' {
  return n === 0 ? 'FEMALE' : 'MALE';
}

/* ===========================================================
   Child Component: UserList
   =========================================================== */
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
    <div className="users-grid">
      {users.map((user) => (
        <Card key={user.userId} className="user-card" onClick={() => goToUserProfile(user.userId)}>
          <div className="user-info">
            <Avatar size={40}>
              <img src={getAvatarUrl(user.avatar)} alt="" />
              {user.username?.charAt(0).toUpperCase()}
            </Avatar>
            <div className="user-text">
              <div className="user-name">{user.username}</div>
              {user.realName && <div className="user-real-name">{user.realName}</div>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* ===========================================================
   Main Component: UserProfile
   =========================================================== */
const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const [activeMainTab, setActiveMainTab] = useState('posts');
  const [editActiveTab, setEditActiveTab] = useState('basic');
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showFollowerDialog, setShowFollowerDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [postCount, setPostCount] = useState(0);

  const [userStats, setUserStats] = useState({ followingCount: 0, followerCount: 0 });
  const [followingUsers, setFollowingUsers] = useState<UserProfileVO[]>([]);
  const [followerUsers, setFollowerUsers] = useState<UserProfileVO[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);

  const securitySettingsRef = useRef<SecuritySettingsRef>(null);

  const [basicForm, setBasicForm] = useState({
    realName: '',
    gender: 1 as 1 | 0,
    birthday: '',
    phone: '',
    email: '',
  });

  /* --- Data loading --- */
  const loadUserStats = useCallback(async () => {
    if (!userStore.userInfo?.id) return;
    const res = await userFollowApi.getUserFollowStats(userStore.userInfo.id);
    if (res.code === 200) {
      setUserStats({
        followingCount: res.data.followingCount,
        followerCount: res.data.followerCount,
      });
    }
  }, [userStore.userInfo?.id]);

  const loadLoginHistory = useCallback(async () => {
    if (userStore.userInfo?.lastLoginAt) {
      try {
        const ipAddress = userStore.userInfo.lastLoginIp || 'Unknown';
        let location = 'Unknown';
        if (ipAddress !== 'Unknown') {
          location = await getLocationFromIp(ipAddress);
        }
        setLoginHistory([
          {
            loginTime: userStore.userInfo.lastLoginAt.replace('T', ' ').substring(0, 19),
            ipAddress,
            location,
            device: userStore.userInfo.lastLoginDevice || 'Unknown',
          },
        ]);
      } catch (error) {
        console.error('Failed to load login history:', error);
        setLoginHistory([
          {
            loginTime: userStore.userInfo.lastLoginAt.replace('T', ' ').substring(0, 19),
            ipAddress: 'Unknown',
            location: 'Unknown',
            device: 'Unknown',
          },
        ]);
      }
    } else {
      setLoginHistory([]);
    }
  }, [userStore.userInfo?.lastLoginAt, userStore.userInfo?.lastLoginIp, userStore.userInfo?.lastLoginDevice]);

  /* --- Following/Follower list --- */
  const showFollowingList = async () => {
    if (!userStore.userInfo?.id) return;
    const res = await userFollowApi.listFollowingUsers(userStore.userInfo.id, 1, 50);
    if (res.code === 200) {
      setFollowingUsers(res.data.rows);
      setShowFollowingDialog(true);
    }
  };

  const showFollowerList = async () => {
    if (!userStore.userInfo?.id) return;
    const res = await userFollowApi.listFollowerUsers(userStore.userInfo.id, 1, 50);
    if (res.code === 200) {
      setFollowerUsers(res.data.rows);
      setShowFollowerDialog(true);
    }
  };

  /* --- Operations --- */
  const handleUpdateBasic = async (formData: {
    realName: string;
    gender: 1 | 0;
    birthday: string;
    phone: string;
    email: string;
  }) => {
    setUpdating(true);
    try {
      await userStore.updateProfile({
        realName: formData.realName,
        gender: numToGender(formData.gender),
        birthday: formData.birthday ? formData.birthday + 'T00:00:00' : undefined,
        avatar: userStore.userProfile?.avatar,
      });
      if (userStore.userInfo?.id) {
        await userApi.updateUser(userStore.userInfo.id, {
          phone: formData.phone,
          email: formData.email,
        });
      }
      await userStore.fetchUserInfo();
      Message.success('更新成功');
    } catch {
      Message.error('更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (pwdData: { oldPassword: string; newPassword: string }) => {
    setChangingPassword(true);
    try {
      const res = await userStore.changePassword(pwdData.oldPassword, pwdData.newPassword);
      if (res.success) {
        Message.success('密码修改成功');
        securitySettingsRef.current?.resetPasswordForm();
      } else {
        Message.error(res.message || '操作失败');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '警告',
      content: '确定注销账号吗？这是不可逆的操作！',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        Modal.confirm({
          title: '二次确认',
          content: (
            <div>
              <p>请输入 "DELETE" 确认</p>
              <Input
                placeholder="DELETE"
                onChange={(value) => {
                  (Modal.confirm as any)._inputValue = value;
                }}
              />
            </div>
          ),
          onOk: async () => {
            const res = await userStore.deleteAccount();
            if (res.success) {
              Message.success('注销成功');
              navigate('/');
            } else {
              Message.error(res.message || '注销失败');
            }
          },
        });
      },
    });
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      const res = await userProfileApi.uploadAvatar(file);
      if (res.code === 200) {
        Message.success('头像上传成功');
        if (userStore.userProfile) {
          userStore.userProfile.avatar = res.data;
        }
      } else {
        Message.error(res.message || '上传失败');
      }
    } catch (e: any) {
      Message.error(e.message || '上传失败');
    }
  };

  const beforeAvatarUpload = (file: File): boolean => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) Message.error('大小不能超过 2MB!');
    return isLt2M;
  };

  /* --- Init --- */
  useEffect(() => {
    if (userStore.userProfile) {
      setBasicForm({
        realName: userStore.userProfile.realName || '',
        gender: genderToNum(userStore.userProfile.gender),
        birthday: userStore.userProfile.birthday?.slice(0, 10) || '',
        phone: userStore.userProfile.phone || '',
        email: userStore.userProfile.email || '',
      });
    }
    loadUserStats();
    loadLoginHistory();
  }, [userStore.userProfile, loadUserStats, loadLoginHistory]);

  return (
    <div className="user-profile">
      <Card className="profile-header">
        <div className="profile-main">
          <div className="profile-avatar">
            <Upload
              action="#"
              showUploadList={false}
              customRequest={({ file }) => handleUploadAvatar(file)}
              beforeUpload={beforeAvatarUpload}
            >
              <div className="avatar-uploader">
                {userStore.userProfile?.avatar ? (
                  <Avatar size={120}>
                    <img src={getAvatarUrl(userStore.userProfile.avatar)} alt="" />
                  </Avatar>
                ) : (
                  <Avatar size={120}>
                    {userStore.userInfo?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <div className="avatar-overlay">
                  <IconCamera style={{ fontSize: 24 }} />
                  <p>点击更换</p>
                </div>
              </div>
            </Upload>
          </div>

          <div className="profile-info">
            <div className="profile-basic">
              <h2 className="profile-username">{userStore.userInfo?.username}</h2>
              <div className="profile-stats">
                <div className="stat-item" onClick={showFollowingList}>
                  <span className="stat-number">{userStats.followingCount}</span>
                  <span className="stat-label">关注</span>
                </div>
                <div className="stat-item" onClick={showFollowerList}>
                  <span className="stat-number">{userStats.followerCount}</span>
                  <span className="stat-label">粉丝</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{postCount}</span>
                  <span className="stat-label">文章</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="main-content-card">
        <Tabs activeTab={activeMainTab} onChange={setActiveMainTab} className="main-tabs">
          <Tabs.TabPane key="posts" title="我的文章">
            <MyPosts onPostCountChange={(count) => setPostCount(count)} />
          </Tabs.TabPane>

          <Tabs.TabPane key="collects" title="我的收藏">
            <UserCollectList userId={userStore.userInfo?.id} isOwner={true} />
          </Tabs.TabPane>

          <Tabs.TabPane key="settings" title="设置">
            <div className="settings-container">
              <Tabs
                activeTab={editActiveTab}
                onChange={setEditActiveTab}
                tabPosition="left"
                className="settings-tabs"
              >
                <Tabs.TabPane key="basic" title="基本信息">
                  <div className="settings-content">
                    <div className="settings-header">
                      <h3>基本信息</h3>
                      <p>管理您的个人信息，包括姓名、联系方式等</p>
                    </div>
                    <BasicInfo
                      username={userStore.userInfo?.username}
                      initialData={basicForm}
                      loading={updating}
                      onSave={handleUpdateBasic}
                    />
                  </div>
                </Tabs.TabPane>

                <Tabs.TabPane key="security" title="账号安全">
                  <div className="settings-content">
                    <div className="settings-header">
                      <h3>账号安全</h3>
                      <p>保护您的账号安全，修改密码或进行账号注销</p>
                    </div>
                    <SecuritySettings
                      ref={securitySettingsRef}
                      loading={changingPassword}
                      onChangePassword={handleChangePassword}
                      onDeleteAccount={handleDeleteAccount}
                    />
                  </div>
                </Tabs.TabPane>

                <Tabs.TabPane key="login-history" title="登录历史">
                  <div className="settings-content">
                    <div className="settings-header">
                      <h3>登录历史</h3>
                      <p>查看您最近的账号登录活动</p>
                    </div>
                    <LoginHistory history={loginHistory} />
                  </div>
                </Tabs.TabPane>
              </Tabs>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title="我的关注"
        visible={showFollowingDialog}
        onCancel={() => setShowFollowingDialog(false)}
        footer={null}
        style={{ width: 600 }}
      >
        <UserList users={followingUsers} onClose={() => setShowFollowingDialog(false)} />
      </Modal>

      <Modal
        title="我的粉丝"
        visible={showFollowerDialog}
        onCancel={() => setShowFollowerDialog(false)}
        footer={null}
        style={{ width: 600 }}
      >
        <UserList users={followerUsers} onClose={() => setShowFollowerDialog(false)} />
      </Modal>
    </div>
  );
};

export default UserProfile;
