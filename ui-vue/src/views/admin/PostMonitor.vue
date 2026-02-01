<template>
  <div class="post-monitor">
    <el-card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>博文数据监控</h2>
          <p class="subtitle">
            统一监控推荐效果与内容表现，支持运营配置与推荐策略调优
          </p>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="top-row">
      <el-col :span="10">
        <el-card class="ops-card">
          <div class="card-header">
            <span class="card-title">运营配置</span>
            <span class="card-subtitle">内容排序与推荐策略参数</span>
          </div>

          <el-tabs v-model="activeOpsTab" class="ops-tabs">
            <el-tab-pane label="内容运营" name="content">
              <el-form
                :inline="true"
                :model="postSearchForm"
                class="search-form"
              >
                <el-form-item label="标题">
                  <el-input
                    v-model="postSearchForm.title"
                    placeholder="博文标题"
                    clearable
                    @keyup.enter="loadAdminPosts"
                  />
                </el-form-item>
                <el-form-item label="状态">
                  <el-select
                    v-model="postSearchForm.status"
                    placeholder="全部"
                    clearable
                    style="width: 140px"
                  >
                    <el-option
                      label="已发布"
                      :value="PostStatusEnum.PUBLISHED"
                    />
                    <el-option
                      label="审核中"
                      :value="PostStatusEnum.AUDITING"
                    />
                    <el-option label="草稿" :value="PostStatusEnum.DRAFT" />
                    <el-option
                      label="仅自己可见"
                      :value="PostStatusEnum.PRIVATE"
                    />
                    <el-option
                      label="回收站"
                      :value="PostStatusEnum.RECYCLED"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handlePostSearch">
                    查询
                  </el-button>
                  <el-button @click="handlePostReset">重置</el-button>
                </el-form-item>
              </el-form>

              <el-table
                v-loading="postTableLoading"
                :data="adminPostList"
                size="small"
                border
                class="ops-post-table"
                height="320"
              >
                <el-table-column
                  prop="id"
                  label="ID"
                  width="70"
                  align="center"
                />
                <el-table-column
                  prop="title"
                  label="标题"
                  min-width="160"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="status"
                  label="状态"
                  width="90"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.status)" size="small">
                      {{ getStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="viewCount"
                  label="阅读"
                  width="80"
                  align="center"
                />
                <el-table-column
                  prop="likeCount"
                  label="点赞"
                  width="80"
                  align="center"
                />
                <el-table-column
                  label="运营操作"
                  width="210"
                  fixed="right"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-button-group>
                      <el-button
                        v-if="isPinned(row)"
                        size="small"
                        type="warning"
                        @click="handleUnpinPost(row)"
                      >
                        取消置顶
                      </el-button>
                      <el-button
                        v-else
                        size="small"
                        type="primary"
                        @click="handlePinPost(row)"
                      >
                        置顶
                      </el-button>
                      <el-button
                        v-if="row.status === PostStatusEnum.RECYCLED"
                        size="small"
                        type="success"
                        @click="handleUnblockPost(row)"
                      >
                        取消屏蔽
                      </el-button>
                      <el-button
                        v-else
                        size="small"
                        type="danger"
                        @click="handleBlockPost(row)"
                      >
                        屏蔽
                      </el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="推荐策略" name="algorithm">
              <div class="algo-description">
                <p>
                  调整热度算法各指标权重，用于影响推荐列表排序结果。建议小步调整并观察数据变化。
                </p>
              </div>
              <el-table
                v-loading="algoLoading"
                :data="algoWeights"
                border
                size="small"
                class="algo-table"
                height="360"
              >
                <el-table-column
                  prop="metricKey"
                  label="指标"
                  width="120"
                />
                <el-table-column
                  prop="description"
                  label="说明"
                  min-width="200"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="metricValue"
                  label="权重"
                  width="160"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-input-number
                      v-model="row.metricValue"
                      :min="0"
                      :max="100"
                      :step="0.1"
                      size="small"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  label="操作"
                  width="120"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-button
                      size="small"
                      type="primary"
                      @click="handleUpdateAlgoWeight(row)"
                    >
                      保存
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="kpi-card">
          <div class="card-header">
            <span class="card-title">推荐效果数据看板</span>
            <span class="card-subtitle">
              基于近期热门博文样本，监控推荐质量表现
            </span>
          </div>

          <el-row :gutter="16" class="kpi-row">
            <el-col :span="8">
              <div class="kpi-item">
                <div class="kpi-label">整体点击率</div>
                <div class="kpi-value">
                  {{ kpi.clickThroughRate.toFixed(2) }}%
                </div>
                <div class="kpi-desc">点击行为 / 曝光量</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="kpi-item">
                <div class="kpi-label">整体互动率</div>
                <div class="kpi-value">
                  {{ kpi.interactionRate.toFixed(2) }}%
                </div>
                <div class="kpi-desc">点赞、评论、收藏等 / 曝光量</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="kpi-item">
                <div class="kpi-label">样本博文数</div>
                <div class="kpi-value">
                  {{ kpi.samplePostCount }}
                </div>
                <div class="kpi-desc">当前参与统计的热门博文数量</div>
              </div>
            </el-col>
          </el-row>

          <div class="charts-wrapper">
            <div ref="efficiencyChartRef" class="chart-panel" />
            <div ref="topPostsChartRef" class="chart-panel" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="bottom-card">
      <div class="card-header">
        <span class="card-title">热门博文表现明细</span>
        <span class="card-subtitle">对比不同内容在推荐位上的表现</span>
      </div>

      <el-table
        v-loading="hotLoading"
        :data="hotPosts"
        border
        size="small"
      >
        <el-table-column
          type="index"
          label="排名"
          width="70"
          align="center"
        />
        <el-table-column
          prop="title"
          label="标题"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          prop="author"
          label="作者"
          width="120"
          align="center"
        />
        <el-table-column
          prop="viewCount"
          label="曝光(阅读)"
          width="120"
          align="center"
        />
        <el-table-column
          prop="likeCount"
          label="点赞"
          width="90"
          align="center"
        />
        <el-table-column
          prop="commentCount"
          label="评论"
          width="90"
          align="center"
        />
        <el-table-column
          prop="collectCount"
          label="收藏"
          width="90"
          align="center"
        />
        <el-table-column
          prop="shareCount"
          label="分享"
          width="90"
          align="center"
        />
        <el-table-column
          prop="hotScore"
          label="热度分"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            {{ row.hotScore?.toFixed(2) ?? '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi } from '@/api/post'
import type { PostVO } from '@/models/vo/post/PostVO'
import { PostStatusEnum } from '@/models/enum/PostStatusEnum'
import { postHotRankApi } from '@/api/postHotRank'
import type { PostHotRankWeight } from '@/api/postHotRank'
import type { PageResult } from '@/models/response/PageResult'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const echarts: any = (window as any).echarts

const activeOpsTab = ref<'content' | 'algorithm'>('content')

// 运营配置 - 内容列表
const postTableLoading = ref(false)
const adminPostList = ref<PostVO[]>([])

const postSearchForm = reactive({
  title: '',
  status: null as PostStatusEnum | null
})

const loadAdminPosts = async () => {
  postTableLoading.value = true
  try {
    const res = await postApi.searchPostsAdminFixed(
      {
        title: postSearchForm.title,
        author: '',
        tags: '',
        status: postSearchForm.status ?? undefined
      },
      1,
      20
    )
    if (res.code === 200) {
      const page = res.data as PageResult<PostVO>
      adminPostList.value = page.rows
    } else {
      ElMessage.error(res.message || '加载运营博文列表失败')
    }
  } catch (error) {
    console.error('loadAdminPosts error:', error)
    ElMessage.error('加载运营博文列表失败')
  } finally {
    postTableLoading.value = false
  }
}

const handlePostSearch = () => {
  loadAdminPosts()
}

const handlePostReset = () => {
  postSearchForm.title = ''
  postSearchForm.status = null
  loadAdminPosts()
}

const getStatusTagType = (status: PostStatusEnum) => {
  switch (status) {
    case PostStatusEnum.PUBLISHED:
      return 'success'
    case PostStatusEnum.AUDITING:
      return 'warning'
    case PostStatusEnum.DRAFT:
      return 'info'
    case PostStatusEnum.PRIVATE:
      return 'default'
    case PostStatusEnum.RECYCLED:
      return 'danger'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: PostStatusEnum) => {
  switch (status) {
    case PostStatusEnum.PUBLISHED:
      return '已发布'
    case PostStatusEnum.AUDITING:
      return '审核中'
    case PostStatusEnum.DRAFT:
      return '草稿'
    case PostStatusEnum.PRIVATE:
      return '仅自己可见'
    case PostStatusEnum.RECYCLED:
      return '回收站'
    default:
      return status
  }
}

const isPinned = (row: PostVO) => {
  return row.weight != null && row.weight > 1
}

const handlePinPost = async (row: PostVO) => {
  try {
    await ElMessageBox.confirm(
      `确认将《${row.title}》设置为置顶内容吗？该操作会影响推荐排序。`,
      '置顶确认',
      {
        type: 'warning'
      }
    )
    const res = await postApi.updatePostWeight(row.id, 10)
    if (res.code === 200) {
      ElMessage.success('已设置为置顶内容')
      await loadAdminPosts()
    } else {
      ElMessage.error(res.message || '置顶失败')
    }
  } catch {
    // cancel
  }
}

const handleUnpinPost = async (row: PostVO) => {
  try {
    await ElMessageBox.confirm(
      `确认取消《${row.title}》的置顶状态吗？`,
      '取消置顶确认',
      {
        type: 'info'
      }
    )
    const res = await postApi.unpinPost(row.id)
    if (res.code === 200) {
      ElMessage.success('已取消置顶')
      await loadAdminPosts()
    } else {
      ElMessage.error(res.message || '取消置顶失败')
    }
  } catch {
    // cancel
  }
}

const handleBlockPost = async (row: PostVO) => {
  try {
    await ElMessageBox.confirm(
      `确认屏蔽《${row.title}》吗？屏蔽后将不再参与推荐和常规曝光。`,
      '屏蔽确认',
      {
        type: 'warning'
      }
    )
    const res = await postApi.updatePostStatus(row.id, PostStatusEnum.RECYCLED)
    if (res.code === 200) {
      ElMessage.success('已屏蔽该内容')
      loadAdminPosts()
      loadHotPosts()
    } else {
      ElMessage.error(res.message || '屏蔽失败')
    }
  } catch {
    // cancel
  }
}

const handleUnblockPost = async (row: PostVO) => {
  try {
    await ElMessageBox.confirm(
      `确认恢复《${row.title}》的推荐与曝光吗？`,
      '取消屏蔽确认',
      {
        type: 'info'
      }
    )
    const res = await postApi.updatePostStatus(row.id, PostStatusEnum.PUBLISHED)
    if (res.code === 200) {
      ElMessage.success('已取消屏蔽')
      loadAdminPosts()
      loadHotPosts()
    } else {
      ElMessage.error(res.message || '取消屏蔽失败')
    }
  } catch {
    // cancel
  }
}

// 运营配置 - 推荐算法权重
const algoLoading = ref(false)
const algoWeights = ref<PostHotRankWeight[]>([])

const loadAlgoWeights = async () => {
  algoLoading.value = true
  try {
    const res = await postHotRankApi.getWeights()
    if (res.code === 200) {
      algoWeights.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载算法权重失败')
    }
  } catch (error) {
    console.error('loadAlgoWeights error:', error)
    ElMessage.error('加载算法权重失败')
  } finally {
    algoLoading.value = false
  }
}

const handleUpdateAlgoWeight = async (row: PostHotRankWeight) => {
  try {
    const res = await postHotRankApi.updateWeight(row.id, row.metricValue)
    if (res.code === 200) {
      ElMessage.success('已更新算法权重')
      await loadAlgoWeights()
      await loadHotPosts()
    } else {
      ElMessage.error(res.message || '更新算法权重失败')
    }
  } catch (error) {
    console.error('update weight error:', error)
    ElMessage.error('更新算法权重失败')
  }
}

// 数据分析 - KPI 与图表
const hotLoading = ref(false)
const hotPosts = ref<PostVO[]>([])

const kpi = reactive({
  clickThroughRate: 0,
  interactionRate: 0,
  samplePostCount: 0
})

const efficiencyChartRef = ref<HTMLElement | null>(null)
const topPostsChartRef = ref<HTMLElement | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let efficiencyChart: any | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let topPostsChart: any | null = null

const calcKpiFromHotPosts = () => {
  if (!hotPosts.value.length) {
    kpi.clickThroughRate = 0
    kpi.interactionRate = 0
    kpi.samplePostCount = 0
    return
  }

  let totalView = 0
  let totalClick = 0
  let totalInteraction = 0

  hotPosts.value.forEach(post => {
    const view = post.viewCount || 0
    const like = post.likeCount || 0
    const comment = post.commentCount || 0
    const collect = post.collectCount || 0
    const share = post.shareCount || 0

    totalView += view
    // 将点赞 + 收藏 + 分享视为点击类行为
    totalClick += like + collect + share
    // 互动包括点赞、评论、收藏、分享
    totalInteraction += like + comment + collect + share
  })

  kpi.samplePostCount = hotPosts.value.length
  if (totalView === 0) {
    kpi.clickThroughRate = 0
    kpi.interactionRate = 0
  } else {
    kpi.clickThroughRate = (totalClick / totalView) * 100
    kpi.interactionRate = (totalInteraction / totalView) * 100
  }
}

const renderCharts = () => {
  if (!echarts) {
    console.warn('ECharts 未加载，请确认 index.html 中已引入 CDN 脚本')
    return
  }

  if (efficiencyChartRef.value) {
    if (!efficiencyChart) {
      efficiencyChart = echarts.init(efficiencyChartRef.value)
    }
    efficiencyChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>{c}%'
      },
      xAxis: {
        type: 'category',
        data: ['点击率', '互动率']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          type: 'bar',
          data: [
            Number(kpi.clickThroughRate.toFixed(2)),
            Number(kpi.interactionRate.toFixed(2))
          ],
          barWidth: 40,
          itemStyle: {
            color: '#409EFF'
          }
        }
      ]
    })
  }

  if (topPostsChartRef.value) {
    if (!topPostsChart) {
      topPostsChart = echarts.init(topPostsChartRef.value)
    }
    const titles = hotPosts.value.map(p => p.title)
    const views = hotPosts.value.map(p => p.viewCount || 0)
    const likes = hotPosts.value.map(p => p.likeCount || 0)

    topPostsChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['曝光', '点赞']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: titles,
        axisLabel: {
          interval: 0,
          rotate: 30,
          formatter: (value: string) =>
            value.length > 8 ? `${value.slice(0, 8)}...` : value
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '曝光',
          type: 'bar',
          data: views,
          itemStyle: {
            color: '#67C23A'
          }
        },
        {
          name: '点赞',
          type: 'bar',
          data: likes,
          itemStyle: {
            color: '#E6A23C'
          }
        }
      ]
    })
  }
}

const handleResize = () => {
  if (efficiencyChart) {
    efficiencyChart.resize()
  }
  if (topPostsChart) {
    topPostsChart.resize()
  }
}

const loadHotPosts = async () => {
  hotLoading.value = true
  try {
    const res = await postApi.getHotPosts(10)
    if (res.code === 200) {
      hotPosts.value = res.data || []
      calcKpiFromHotPosts()
      renderCharts()
    } else {
      ElMessage.error(res.message || '加载热门博文数据失败')
    }
  } catch (error) {
    console.error('loadHotPosts error:', error)
    ElMessage.error('加载热门博文数据失败')
  } finally {
    hotLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadAdminPosts(), loadAlgoWeights(), loadHotPosts()])
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (efficiencyChart) {
    efficiencyChart.dispose()
    efficiencyChart = null
  }
  if (topPostsChart) {
    topPostsChart.dispose()
    topPostsChart = null
  }
})
</script>

<style scoped>
.post-monitor {
  padding: 0;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.top-row {
  margin-bottom: 20px;
}

.ops-card,
.kpi-card {
  border-radius: 12px;
  height: 100%;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-subtitle {
  font-size: 13px;
  color: #909399;
}

.ops-tabs {
  margin-top: 8px;
}

.search-form {
  margin-bottom: 8px;
}

.ops-post-table {
  margin-top: 8px;
}

.algo-description {
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.algo-table {
  margin-top: 4px;
}

.kpi-row {
  margin-bottom: 12px;
}

.kpi-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.kpi-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.kpi-desc {
  font-size: 12px;
  color: #c0c4cc;
}

.charts-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 4px;
}

.chart-panel {
  height: 220px;
}

.bottom-card {
  border-radius: 12px;
}
</style>

