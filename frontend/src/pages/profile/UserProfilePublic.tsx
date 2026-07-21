import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Button,
  Tabs,
  Empty,
  Pagination,
  Tag,
  Descriptions,
  Modal,
  Message,
} from '@arco-design/web-react';
import {
  IconStar,
  IconEye,
  IconMessage,
  IconUser,
} from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import * as userProfileApi from '@/api/user/userProfile.ts';
import * as userFollowApi from '@/api/user/userFollow.ts';
import * as userMessageApi from '@/api/user/userMessage.ts';
import * as postApi from '@/api/post/post.ts';
import { getAvatarUrl } from '@/utils/file';
import type { UserProfileVO } from '@/models/vo/user';
import type { PostVO } from '@/models/vo/post';
import UserList from '@/components/user/UserList';
import UserCollectList from '@/components/user/UserCollectList';
import './UserProfilePublic.css';

const UserProfilePublic: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const userStore = useUserStore();

  const userIdNum = Number(userId);

  // UI control
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowButton, setShowFollowButton] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showFollowerDialog, setShowFollowerDialog] = useState(false);
  const [canChat, setCanChat] = useState(false);

  // Data
  const [userProfile, setUserProfile] = useState<UserProfileVO | null>(null);
  const [userStats, setUserStats] = useState({
    followingCount: 0,
    followerCount: 0,
  });
  const [posts, setPosts] = useState<PostVO[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [followingUsers, setFollowingUsers] = useState<UserProfileVO[]>([]);
  const [followerUsers, setFollowerUsers] = useState<UserProfileVO[]>([]);

  /* --- Data loading --- */
  const loadUserStats = async () => {
    const response = await userFollowApi.getUserFollowStats(userIdNum);
    if (response.code === 200) setUserStats(response.data);
  };

  const checkFollowingStatus = async () => {
    // Don't show follow button if viewing own profile
    if (userStore.userInfo?.id === userIdNum) {
      setShowFollowButton(false);
      return;
    }

    const response = await userFollowApi.isFollowing(userIdNum);
    if (response.code === 200) {
      setIsFollowing(response.data);
      setShowFollowButton(true);
    }

    // Check if can chat (mutual follow)
    const chatResponse = await userMessageApi.canChatWith(userIdNum);
    if (chatResponse.code === 200) {
      setCanChat(chatResponse.data);
    }
  };

  const loadUserPosts = async () => {
    const response = await postApi.listPublishedPostsByUserId(
      userIdNum,
      currentPage,
      pageSize
    );
    if (response.code === 200) {
      setPosts(response.data.rows);
      setTotalPosts(response.data.total);
      setPostCount(response.data.total);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await userProfileApi.getUserProfileByUserId(userIdNum);
      if (response.code === 200) {
        setUserProfile(response.data);
        await loadUserStats();
        await checkFollowingStatus();
        await loadUserPosts();
      } else {
        Message.error('用户不存在');
        navigate('/404');
      }
    } catch {
      Message.error('加载用户信息失败');
      navigate('/404');
    }
  };

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdNum]);

  // Reload posts when page changes
  useEffect(() => {
    if (userProfile) {
      loadUserPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Event handlers
  const toggleFollow = async () => {
    setFollowLoading(true);
    try {
      const response = isFollowing
        ? await userFollowApi.unfollowUser(userIdNum)
        : await userFollowApi.followUser(userIdNum);

      if (response.code === 200) {
        setIsFollowing(!isFollowing);
        Message.success(isFollowing ? '已取消关注' : '关注成功');
        await loadUserStats();
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const showFollowingList = async () => {
    const response = await userFollowApi.listFollowingUsers(userIdNum, 1, 50);
    if (response.code === 200) {
      setFollowingUsers(response.data.rows);
      setShowFollowingDialog(true);
    }
  };

  const showFollowerList = async () => {
    const response = await userFollowApi.listFollowerUsers(userIdNum, 1, 50);
    if (response.code === 200) {
      setFollowerUsers(response.data.rows);
      setShowFollowerDialog(true);
    }
  };

  const startChat = () => {
    navigate(`/chat/${userIdNum}?name=${userProfile?.username || ''}`);
  };

  const formatGender = (g?: string) =>
    g === 'MALE' ? '男' : g === 'FEMALE' ? '女' : '-';

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('zh-CN') : '';

  const goToPostDetail = (id: number) => navigate(`/post/${id}`);

  const handleSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCurrentChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="user-profile-public">
      <Card className="profile-header">
        <div className="profile-main">
          <div className="profile-avatar">
            <Avatar size={120}>
              <img src={getAvatarUrl(userProfile?.avatar)} alt="" />
              {userProfile?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </div>
          <div className="profile-info">
            <div className="profile-basic">
              <h2 className="profile-username">{userProfile?.username}</h2>
              <div className="profile-stats">
                <div className="stat-item" onClick={showFollowingList}>
                  <span className="stat-number">
                    {userStats.followingCount}
                  </span>
                  <span className="stat-label">关注</span>
                </div>
                <div className="stat-item" onClick={showFollowerList}>
                  <span className="stat-number">
                    {userStats.followerCount}
                  </span>
                  <span className="stat-label">粉丝</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{postCount}</span>
                  <span className="stat-label">文章</span>
                </div>
              </div>
            </div>
            <div className="profile-actions">
              {showFollowButton && (
                <Button
                  type={isFollowing ? 'secondary' : 'primary'}
                  icon={<IconStar />}
                  onClick={toggleFollow}
                  loading={followLoading}
                  size="large"
                >
                  {isFollowing ? '取消关注' : '关注'}
                </Button>
              )}
              {canChat && (
                <Button
                  type="primary"
                  status="success"
                  icon={<IconUser />}
                  onClick={startChat}
                  size="large"
                >
                  发消息
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="profile-content">
        <Tabs activeTab={activeTab} onChange={setActiveTab} className="profile-tabs">
          <Tabs.TabPane key="posts" title="文章">
            <div className="tab-pane-container">
              {posts.length === 0 ? (
                <Empty description="暂无文章" />
              ) : (
                <div className="posts-grid">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      className="post-card"
                      hoverable
                      onClick={() => goToPostDetail(post.id)}
                    >
                      <h3 className="post-title">{post.title}</h3>
                      <div className="post-meta">
                        <span className="post-date">
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="post-stats">
                          <IconEye /> {post.viewCount || 0}
                          <IconMessage /> {post.commentCount || 0}
                          <IconStar /> {post.likeCount || 0}
                        </span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.map((tag) => (
                            <Tag key={tag} size="small" color="gray" className="tag">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {totalPosts > pageSize && (
                <div className="pagination-wrapper">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalPosts}
                    sizeOptions={[10, 20, 50]}
                    showTotal
                    showJumper
                    
                    onChange={handleCurrentChange}
                    onPageSizeChange={handleSizeChange}
                  />
                </div>
              )}
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="collects" title="收藏">
            <UserCollectList userId={userIdNum} isOwner={false} />
          </Tabs.TabPane>

          <Tabs.TabPane key="profile" title="个人信息">
            <div className="tab-pane-container">
              <Descriptions
                column={1}
                border
                labelStyle={{ width: 100 }}
                data={[
                  {
                    label: '用户名',
                    value: userProfile?.username || '-',
                  },
                  {
                    label: '真实姓名',
                    value: userProfile?.realName || '-',
                  },
                  {
                    label: '性别',
                    value: formatGender(userProfile?.gender),
                  },
                  {
                    label: '生日',
                    value: userProfile?.birthday
                      ? formatDate(userProfile.birthday)
                      : '-',
                  },
                  {
                    label: '手机号',
                    value: userProfile?.phone || '-',
                  },
                  {
                    label: '邮箱',
                    value: userProfile?.email || '-',
                  },
                ]}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title="关注列表"
        visible={showFollowingDialog}
        onCancel={() => setShowFollowingDialog(false)}
        footer={null}
      >
        <UserList
          users={followingUsers}
          onClose={() => setShowFollowingDialog(false)}
        />
      </Modal>

      <Modal
        title="粉丝列表"
        visible={showFollowerDialog}
        onCancel={() => setShowFollowerDialog(false)}
        footer={null}
      >
        <UserList
          users={followerUsers}
          onClose={() => setShowFollowerDialog(false)}
        />
      </Modal>
    </div>
  );
};

export default UserProfilePublic;
