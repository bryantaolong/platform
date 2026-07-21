import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomeLayout from './layouts/HomeLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/Home'
import FollowingPosts from './pages/post/FollowingPosts'
import MessageList from './pages/message/MessageList'
import ChatView from './pages/message/ChatView'
import HotPosts from './pages/post/HotPosts'
import RecommendFeed from './pages/post/RecommendFeed'
import UserManagement from './pages/admin/UserManagement'
import PostManagement from './pages/admin/PostManagement'
import PostMonitor from './pages/admin/PostMonitor'
import PostAuditList from './pages/admin/PostAuditList'
import UserProfile from './pages/profile/UserProfile'
import SystemLog from './pages/admin/SystemLog'
import PostList from './pages/post/PostList'
import PostDetail from './pages/post/PostDetail'
import PostEdit from './pages/post/PostEdit'
import PostCreate from './pages/post/PostCreate'
import PostAudit from './pages/post/PostAudit'
import UserProfilePublic from './pages/profile/UserProfilePublic'
import NotFound from './pages/NotFound'
import { RequireAuth, RequireAdmin } from './router/guards'

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomeLayout />}>
          <Route index element={<Home />} />
          <Route path="following" element={<RequireAuth><FollowingPosts /></RequireAuth>} />
          <Route path="messages" element={<RequireAuth><MessageList /></RequireAuth>} />
          <Route path="chat/:userId" element={<RequireAuth><ChatView /></RequireAuth>} />
          <Route path="hot" element={<HotPosts />} />
          <Route path="recommend" element={<RecommendFeed />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminLayout /></RequireAdmin></RequireAuth>}>
          <Route path="users" element={<UserManagement />} />
          <Route path="posts" element={<PostManagement />} />
          <Route path="post-monitor" element={<PostMonitor />} />
          <Route path="audit" element={<PostAuditList />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="logs" element={<SystemLog />} />
        </Route>

        <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />

        <Route path="/post" element={<HomeLayout />}>
          <Route path="list" element={<PostList />} />
          <Route path=":id" element={<PostDetail />} />
          <Route path=":id/edit" element={<RequireAuth><PostEdit /></RequireAuth>} />
          <Route path="create" element={<RequireAuth><PostCreate /></RequireAuth>} />
          <Route path=":id/audit" element={<RequireAuth><RequireAdmin><PostAudit /></RequireAdmin></RequireAuth>} />
        </Route>

        <Route path="/user/:userId" element={<RequireAuth><UserProfilePublic /></RequireAuth>} />

        <Route path="/" element={<HomeLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
