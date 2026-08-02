<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Table,
  Tag,
  Message,
  Modal,
  Tabs,
  Grid,
  InputNumber,
} from '@arco-design/web-vue'
import * as postApi from '@/api/post/post'
import * as postAlgorithmAdminApi from '@/api/post/postAlgorithmAdmin'
import * as postHotRankApi from '@/api/post/postHotRank'
import type { PostVO, PostStatusEnum, PageResponse, PostHotRankWeight } from '@/types'
import './PostMonitor.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const echarts: any = (window as any).echarts;

const statusTagColorMap: Record<PostStatusEnum, string> = {
  [PostStatusEnum.PUBLISHED]: 'green',
  [PostStatusEnum.AUDITING]: 'orange',
  [PostStatusEnum.DRAFT]: 'gray',
  [PostStatusEnum.PRIVATE]: 'default',
  [PostStatusEnum.RECYCLED]: 'red',
};

const statusLabelMap: Record<PostStatusEnum, string> = {
  [PostStatusEnum.PUBLISHED]: '已发布',
  [PostStatusEnum.AUDITING]: '审核中',
  [PostStatusEnum.DRAFT]: '草稿',
  [PostStatusEnum.PRIVATE]: '仅自己可见',
  [PostStatusEnum.RECYCLED]: '回收站',
};

const activeOpsTab = ref<'content' | 'algorithm'>('content')

// 运营配置 - 内容列表
const postTableLoading = ref(false)
const adminPostList = ref<PostVO[]>([])
const postSearchForm = ref<{
  title: string
  status: PostStatusEnum | null
}>({
  title: '',
  status: null,
})

// 运营配置 - 推荐算法权重
const algoLoading = ref(false)
const algoWeights = ref<PostHotRankWeight[]>([])

// 数据分析 - KPI 与图表
const hotLoading = ref(false)
const hotPosts = ref<PostVO[]>([])
const kpi = ref({
  clickThroughRate: 0,
  interactionRate: 0,
  samplePostCount: 0,
})

const efficiencyChartRef = ref<HTMLDivElement | null>(null)
const topPostsChartRef = ref<HTMLDivElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const efficiencyChartInstance = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topPostsChartInstance = ref<any>(null)

const loadAdminPosts = async () => {
  postTableLoading.value = true
  try {
    const res = await postApi.queryPosts(
      {
        title: postSearchForm.value.title,
        author: '',
        tags: '',
        status: postSearchForm.value.status ?? undefined,
      },
      1,
      20
    )
    if (res.code === 200) {
      const page = res.data as PageResponse<PostVO>
      adminPostList.value = page.rows
    } else {
      Message.error(res.message || '加载运营博文列表失败')
    }
  } catch (error) {
    console.error('loadAdminPosts error:', error)
    Message.error('加载运营博文列表失败')
  } finally {
    postTableLoading.value = false
  }
}

const handlePostSearch = () => {
  loadAdminPosts()
}

const handlePostReset = () => {
  postSearchForm.value = { title: '', status: null }
}

const renderCharts = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts: any[],
  currentKpi: { clickThroughRate: number; interactionRate: number }
) => {
  if (!echarts) {
    console.warn('ECharts 未加载，请确认 index.html 中已引入 CDN 脚本')
    return
  }

  if (efficiencyChartRef.value) {
    if (!efficiencyChartInstance.value) {
      efficiencyChartInstance.value = echarts.init(efficiencyChartRef.value)
    }
    efficiencyChartInstance.value.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>{c}%',
      },
      xAxis: {
        type: 'category',
        data: ['点击率', '互动率'],
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          type: 'bar',
          data: [
            Number(currentKpi.clickThroughRate.toFixed(2)),
            Number(currentKpi.interactionRate.toFixed(2)),
          ],
          barWidth: 40,
          itemStyle: {
            color: '#409EFF',
          },
        },
      ],
    })
  }

  if (topPostsChartRef.value) {
    if (!topPostsChartInstance.value) {
      topPostsChartInstance.value = echarts.init(topPostsChartRef.value)
    }
    const titles = posts.map((p: { title: string }) => p.title)
    const views = posts.map((p: { viewCount?: number }) => p.viewCount || 0)
    const likes = posts.map((p: { likeCount?: number }) => p.likeCount || 0)

    topPostsChartInstance.value.setOption({
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['曝光', '点赞'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: titles,
        axisLabel: {
          interval: 0,
          rotate: 30,
          formatter: (value: string) =>
            value.length > 8 ? `${value.slice(0, 8)}...` : value,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '曝光',
          type: 'bar',
          data: views,
          itemStyle: {
            color: '#67C23A',
          },
        },
        {
          name: '点赞',
          type: 'bar',
          data: likes,
          itemStyle: {
            color: '#E6A23C',
          },
        },
      ],
    })
  }
}

const handleResize = () => {
  if (efficiencyChartInstance.value) {
    efficiencyChartInstance.value.resize()
  }
  if (topPostsChartInstance.value) {
    topPostsChartInstance.value.resize()
  }
}

// Combined hot posts load + KPI calc + chart render
const loadHotPostsWithKpi = async () => {
  hotLoading.value = true
  try {
    const res = await postHotRankApi.listHotPosts(10)
    if (res.code === 200) {
      const posts = res.data || []
      hotPosts.value = posts

      // Calculate KPI
      if (!posts.length) {
        const emptyKpi = {
          clickThroughRate: 0,
          interactionRate: 0,
          samplePostCount: 0,
        }
        kpi.value = emptyKpi
        renderCharts(posts, emptyKpi)
      } else {
        let totalView = 0
        let totalClick = 0
        let totalInteraction = 0

        posts.forEach((post: { viewCount?: number; likeCount?: number; commentCount?: number; collectCount?: number; shareCount?: number }) => {
          const view = post.viewCount || 0
          const like = post.likeCount || 0
          const comment = post.commentCount || 0
          const collect = post.collectCount || 0
          const share = post.shareCount || 0

          totalView += view
          totalClick += like + collect + share
          totalInteraction += like + comment + collect + share
        })

        const newKpi = {
          clickThroughRate: totalView === 0 ? 0 : (totalClick / totalView) * 100,
          interactionRate: totalView === 0 ? 0 : (totalInteraction / totalView) * 100,
          samplePostCount: posts.length,
        }
        kpi.value = newKpi
        renderCharts(posts, newKpi)
      }
    } else {
      Message.error(res.message || '加载热门博文数据失败')
    }
  } catch (error) {
    console.error('loadHotPosts error:', error)
    Message.error('加载热门博文数据失败')
  } finally {
    hotLoading.value = false
  }
}

// Reload posts when search form changes after reset
const isFirstRender = ref(true)
onMounted(() => {
  loadAdminPosts()
  loadAlgoWeights()
  loadHotPostsWithKpi()
})

watch(postSearchForm, () => {
  if (isFirstRender.value) {
    isFirstRender.value = false
    return
  }
  loadAdminPosts()
})

// Resize handler
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (efficiencyChartInstance.value) {
    efficiencyChartInstance.value.dispose()
    efficiencyChartInstance.value = null
  }
  if (topPostsChartInstance.value) {
    topPostsChartInstance.value.dispose()
    topPostsChartInstance.value = null
  }
})

const isPinned = (row: PostVO) => {
  return row.weight != null && row.weight > 1
}

const handlePinPost = async (row: PostVO) => {
  Modal.confirm({
    title: '置顶确认',
    content: `确认将《${row.title}》设置为置顶内容吗？该操作会影响推荐排序。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await postAlgorithmAdminApi.pinPost(row.id)
        if (res.code === 200) {
          Message.success('已设置为置顶内容')
          loadAdminPosts()
        } else {
          Message.error(res.message || '置顶失败')
        }
      } catch (error) {
        console.error('pin post error:', error)
        Message.error('置顶失败')
      }
    },
  })
}

const handleUnpinPost = async (row: PostVO) => {
  Modal.confirm({
    title: '取消置顶确认',
    content: `确认取消《${row.title}》的置顶状态吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await postAlgorithmAdminApi.unpinPost(row.id)
        if (res.code === 200) {
          Message.success('已取消置顶')
          loadAdminPosts()
        } else {
          Message.error(res.message || '取消置顶失败')
        }
      } catch (error) {
        console.error('unpin post error:', error)
        Message.error('取消置顶失败')
      }
    },
  })
}

const handleBlockPost = async (row: PostVO) => {
  Modal.confirm({
    title: '屏蔽确认',
    content: `确认屏蔽《${row.title}》吗？屏蔽后将不再参与推荐和常规曝光。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await postApi.updatePostStatus(row.id, PostStatusEnum.RECYCLED)
        if (res.code === 200) {
          Message.success('已屏蔽该内容')
          loadAdminPosts()
          loadHotPostsWithKpi()
        } else {
          Message.error(res.message || '屏蔽失败')
        }
      } catch (error) {
        console.error('block post error:', error)
        Message.error('屏蔽失败')
      }
    },
  })
}

const handleUnblockPost = async (row: PostVO) => {
  Modal.confirm({
    title: '取消屏蔽确认',
    content: `确认恢复《${row.title}》的推荐与曝光吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await postApi.updatePostStatus(row.id, PostStatusEnum.PUBLISHED)
        if (res.code === 200) {
          Message.success('已取消屏蔽')
          loadAdminPosts()
          loadHotPostsWithKpi()
        } else {
          Message.error(res.message || '取消屏蔽失败')
        }
      } catch (error) {
        console.error('unblock post error:', error)
        Message.error('取消屏蔽失败')
      }
    },
  })
}

const loadAlgoWeights = async () => {
  algoLoading.value = true
  try {
    const res = await postAlgorithmAdminApi.listWeights()
    if (res.code === 200) {
      algoWeights.value = res.data || []
    } else {
      Message.error(res.message || '加载算法权重失败')
    }
  } catch (error) {
    console.error('loadAlgoWeights error:', error)
    Message.error('加载算法权重失败')
  } finally {
    algoLoading.value = false
  }
}

const handleUpdateAlgoWeight = async (row: PostHotRankWeight) => {
  try {
    const res = await postAlgorithmAdminApi.updateWeight(row.id, row.metricValue) as unknown as { code: number; message?: string }
    if (res.code === 200) {
      Message.success('已更新算法权重')
      loadAlgoWeights()
      loadHotPostsWithKpi()
    } else {
      Message.error(res.message || '更新算法权重失败')
    }
  } catch (error) {
    console.error('update weight error:', error)
    Message.error('更新算法权重失败')
  }
}

const postColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 70,
    align: 'center',
  },
  {
    title: '标题',
    dataIndex: 'title',
    ellipsis: true,
    minWidth: 160,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
    align: 'center',
    render: ({ row }: { row: PostVO }) => {
      const status = row.status as PostStatusEnum
      const color = statusTagColorMap[status] || 'default'
      const label = statusLabelMap[status] || status
      return h(Tag, { color }, () => label)
    },
  },
  {
    title: '阅读',
    dataIndex: 'viewCount',
    width: 80,
    align: 'center',
  },
  {
    title: '点赞',
    dataIndex: 'likeCount',
    width: 80,
    align: 'center',
  },
  {
    title: '运营操作',
    width: 210,
    align: 'center',
    fixed: 'right',
    render: ({ row }: { row: PostVO }) => h('div', { style: { display: 'flex', gap: 4, justifyContent: 'center' } }, [
      isPinned(row) ? h(Button, { size: 'small', type: 'primary', status: 'warning', onClick: () => handleUnpinPost(row) }, () => '取消置顶') : h(Button, { size: 'small', type: 'primary', onClick: () => handlePinPost(row) }, () => '置顶'),
      row.status === PostStatusEnum.RECYCLED ? h(Button, { size: 'small', type: 'primary', status: 'success', onClick: () => handleUnblockPost(row) }, () => '取消屏蔽') : h(Button, { size: 'small', type: 'primary', status: 'danger', onClick: () => handleBlockPost(row) }, () => '屏蔽'),
    ]),
  },
]

const algoColumns = [
  {
    title: '指标',
    dataIndex: 'metricKey',
    width: 120,
  },
  {
    title: '说明',
    dataIndex: 'description',
    ellipsis: true,
    minWidth: 200,
  },
  {
    title: '权重',
    dataIndex: 'metricValue',
    width: 160,
    align: 'center',
    render: ({ row }: { row: PostHotRankWeight }) => h(InputNumber, {
      modelValue: row.metricValue,
      min: 0,
      max: 100,
      step: 0.1,
      size: 'small',
      onChange: (value: number | undefined) => {
        const updated = algoWeights.value.map((w) =>
          w.id === row.id ? { ...w, metricValue: value } : w
        )
        algoWeights.value = updated
      },
    }),
  },
  {
    title: '操作',
    width: 120,
    align: 'center',
    render: ({ row }: { row: PostHotRankWeight }) => h(Button, { size: 'small', type: 'primary', onClick: () => handleUpdateAlgoWeight(row) }, () => '保存'),
  },
]

const hotColumns = [
  {
    title: '排名',
    width: 70,
    align: 'center',
    render: (_: unknown, __: unknown, index: number) => index + 1,
  },
  {
    title: '标题',
    dataIndex: 'title',
    ellipsis: true,
    minWidth: 220,
  },
  {
    title: '作者',
    dataIndex: 'author',
    width: 120,
    align: 'center',
  },
  {
    title: '曝光(阅读)',
    dataIndex: 'viewCount',
    width: 120,
    align: 'center',
  },
  {
    title: '点赞',
    dataIndex: 'likeCount',
    width: 90,
    align: 'center',
  },
  {
    title: '评论',
    dataIndex: 'commentCount',
    width: 90,
    align: 'center',
  },
  {
    title: '收藏',
    dataIndex: 'collectCount',
    width: 90,
    align: 'center',
  },
  {
    title: '分享',
    dataIndex: 'shareCount',
    width: 90,
    align: 'center',
  },
  {
    title: '热度分',
    dataIndex: 'hotScore',
    width: 110,
    align: 'center',
    render: (_: unknown, record: PostVO) => record.hotScore != null ? record.hotScore.toFixed(2) : '-',
  },
]
</script>

<template>
  <div class="post-monitor">
    <Card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>博文数据监控</h2>
          <p class="subtitle">
            统一监控推荐效果与内容表现，支持运营配置与推荐策略调优
          </p>
        </div>
      </div>
    </Card>

    <a-row :gutter="20" class="top-row">
      <a-col :span="10">
        <Card class="ops-card">
          <div class="card-header">
            <span class="card-title">运营配置</span>
            <span class="card-subtitle">内容排序与推荐策略参数</span>
          </div>

          <a-tabs v-model:active-key="activeOpsTab">
            <a-tab-pane key="content" title="内容运营">
              <Form layout="inline" class="search-form">
                <Form.Item label="标题">
                  <Input
                    v-model="postSearchForm.title"
                    placeholder="博文标题"
                    allow-clear
                    @press-enter="handlePostSearch"
                  />
                </Form.Item>
                <Form.Item label="状态">
                  <Select
                    v-model="postSearchForm.status"
                    placeholder="全部"
                    allow-clear
                    style="width: 140px"
                  >
                    <a-option :value="PostStatusEnum.PUBLISHED">
                      已发布
                    </a-option>
                    <a-option :value="PostStatusEnum.AUDITING">
                      审核中
                    </a-option>
                    <a-option :value="PostStatusEnum.DRAFT">
                      草稿
                    </a-option>
                    <a-option :value="PostStatusEnum.PRIVATE">
                      仅自己可见
                    </a-option>
                    <a-option :value="PostStatusEnum.RECYCLED">
                      回收站
                    </a-option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" @click="handlePostSearch">
                    查询
                  </Button>
                  <Button @click="handlePostReset">重置</Button>
                </Form.Item>
              </Form>

              <Table
                :loading="postTableLoading"
                :columns="postColumns"
                :data="adminPostList"
                size="small"
                border
                class="ops-post-table"
                :scroll="{ y: 320 }"
                row-key="id"
              />
            </a-tab-pane>

            <a-tab-pane key="algorithm" title="推荐策略">
              <div class="algo-description">
                <p>
                  调整热度算法各指标权重，用于影响推荐列表排序结果。建议小步调整并观察数据变化。
                </p>
              </div>
              <Table
                :loading="algoLoading"
                :columns="algoColumns"
                :data="algoWeights"
                border
                size="small"
                class="algo-table"
                :scroll="{ y: 360 }"
                row-key="id"
              />
            </a-tab-pane>
          </a-tabs>
        </Card>
      </a-col>

      <a-col :span="14">
        <Card class="kpi-card">
          <div class="card-header">
            <span class="card-title">推荐效果数据看板</span>
            <span class="card-subtitle">
              基于近期热门博文样本，监控推荐质量表现
            </span>
          </div>

          <a-row :gutter="16" class="kpi-row">
            <a-col :span="8">
              <div class="kpi-item">
                <div class="kpi-label">整体点击率</div>
                <div class="kpi-value">
                  {{ kpi.clickThroughRate.toFixed(2) }}%
                </div>
                <div class="kpi-desc">点击行为 / 曝光量</div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kpi-item">
                <div class="kpi-label">整体互动率</div>
                <div class="kpi-value">
                  {{ kpi.interactionRate.toFixed(2) }}%
                </div>
                <div class="kpi-desc">点赞、评论、收藏等 / 曝光量</div>
              </div>
            </a-col>
            <a-col :span="8">
              <div class="kpi-item">
                <div class="kpi-label">样本博文数</div>
                <div class="kpi-value">{{ kpi.samplePostCount }}</div>
                <div class="kpi-desc">当前参与统计的热门博文数量</div>
              </div>
            </a-col>
          </a-row>

          <div class="charts-wrapper">
            <div ref="efficiencyChartRef" class="chart-panel" />
            <div ref="topPostsChartRef" class="chart-panel" />
          </div>
        </Card>
      </a-col>
    </a-row>

    <Card class="bottom-card">
      <div class="card-header">
        <span class="card-title">热门博文表现明细</span>
        <span class="card-subtitle">对比不同内容在推荐位上的表现</span>
      </div>

      <Table
        :loading="hotLoading"
        :columns="hotColumns"
        :data="hotPosts"
        border
        size="small"
        row-key="id"
      />
    </Card>
  </div>
</template>

<style scoped>
.post-monitor {
  padding: 20px;
}
</style>
