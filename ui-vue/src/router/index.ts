import {createRouter, createWebHistory} from 'vue-router'
import {useUserStore} from '@/stores/user'
import type {RouteRecordRaw} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Index',
        component: () => import('@/layouts/HomeLayout.vue'),
        children: [
            {
                path: '',
                name: 'Home',
                component: () => import('@/views/Home.vue'),
                meta: {title: '首页'}
            },
            {
                path: 'following',
                name: 'FollowingPosts',
                component: () => import('@/views/post/FollowingPosts.vue'),
                meta: {requiresAuth: true, title: '我的关注'}
            },
            {
                path: 'hot',
                name: 'HotPosts',
                component: () => import('@/views/post/HotPosts.vue'),
                meta: {title: '热门文章'}
            }
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: {guest: true}
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: {guest: true}
    },
    {
        path: '/admin',
        component: () => import('@/layouts/AdminLayout.vue'),
        meta: {requiresAuth: true, requiresAdmin: true},
        children: [
            {
                path: 'users',
                name: 'UserManagement',
                component: () => import('@/views/admin/UserManagement.vue'),
                meta: {title: '用户管理'}
            },
            {
                path: 'posts',
                name: 'PostManagement',
                component: () => import('@/views/admin/PostManagement.vue'),
                meta: {title: '博文管理'}
            },
            {
                path: 'post-monitor',
                name: 'PostMonitor',
                component: () => import('@/views/admin/PostMonitor.vue'),
                meta: {title: '博文数据监控'}
            },
            {
                path: 'audit',
                name: 'PostAuditList',
                component: () => import('@/views/admin/PostAuditList.vue'),
                meta: {title: '博文审核'}
            },
            {
                path: 'profile',
                name: 'AdminProfile',
                component: () => import('@/views/profile/UserProfile.vue'),
                meta: {title: '个人中心'}
            },
            {
                path: 'logs',
                name: 'SystemLog',
                component: () => import('@/views/admin/SystemLog.vue'),
                meta: {title: '系统日志'}
            }
        ]
    },
    {
        path: '/profile',
        name: 'UserProfile',
        component: () => import('@/views/profile/UserProfile.vue'),
        meta: {requiresAuth: true, title: '个人中心'}
    },
    {
        path: '/post',
        component: () => import('@/layouts/HomeLayout.vue'),
        children: [
            {
                path: 'list',
                name: 'BlogPostList',
                component: () => import('@/views/post/PostList.vue'),
                meta: {title: '文章列表'}
            },
            {
                path: ':id',
                name: 'PostDetail',
                component: () => import('@/views/post/PostDetail.vue'),
                meta: {title: '文章详情'},
                props: true
            },
            {
                path: ':id/edit',
                name: 'PostEdit',
                component: () => import('@/views/post/PostEdit.vue'),
                meta: {requiresAuth: true, title: '编辑文章'},
                props: true
            },
            {
                path: 'create',
                name: 'PostCreate',
                component: () => import('@/views/post/PostCreate.vue'),
                meta: {requiresAuth: true, title: '新建文章'}
            },
            {
                path: ':id/audit',
                name: 'PostAudit',
                component: () => import('@/views/post/PostAudit.vue'),
                meta: {requiresAuth: true, requiresAdmin: true, title: '博文审核'},
                props: true
            }
        ]
    },
    {
        path: '/user/:userId',
        name: 'UserProfilePublic',
        component: () => import('@/views/profile/UserProfilePublic.vue'),
        meta: {requiresAuth: true, title: '用户主页'},
        props: true
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStore()

    // 如果是游客页面且用户已登录则跳转到首页
    if (to.meta.guest && userStore.isAuthenticated) {
        return next('/')
    }

    // 检查需要认证的页面
    if (to.meta.requiresAuth || to.meta.requiresAdmin) {
        if (!userStore.userInfo && userStore.token) {
            try {
                const res = await userStore.fetchUserInfo()
                if (!res.success || !userStore.userInfo) {
                    alert('认证信息失效，请重新登录！')
                    userStore.logout()
                    return next('/login')
                }
            } catch (error) {
                console.error('路由守卫获取用户信息失败:', error)
                alert('网络错误或认证失败，请重新登录！')
                userStore.logout()
                return next('/login')
            }
        } else if (!userStore.token) {
            alert('您尚未登录，请先登录。')
            return next('/login')
        }
    }

    // 检查需要管理员权限的页面
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
        alert('您没有权限访问此页面！')
        return next('/')
    }

    next()
})

router.onError((error, to, from) => {
    console.error('Vue Router 导航错误:', error)
    console.error('跳转目标:', to)
    console.error('跳转来源:', from)
})

export default router
