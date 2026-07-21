import { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@arco-design/web-react';
import * as postApi from '@/api/post/post';
import * as postAlgorithmAdminApi from '@/api/post/postAlgorithmAdmin';
import * as postHotRankApi from '@/api/post/postHotRank';
import type { PostVO } from '@/models/vo/post';
import { PostStatusEnum } from '@/models/enum';
import type { PageResult } from '@/models/response';
import type { PostHotRankWeight } from '@/models/entity/algorithm';
import './PostMonitor.css';

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

const PostMonitor = () => {
  const [activeOpsTab, setActiveOpsTab] = useState<'content' | 'algorithm'>('content');

  // 运营配置 - 内容列表
  const [postTableLoading, setPostTableLoading] = useState(false);
  const [adminPostList, setAdminPostList] = useState<PostVO[]>([]);
  const [postSearchForm, setPostSearchForm] = useState<{
    title: string;
    status: PostStatusEnum | null;
  }>({
    title: '',
    status: null,
  });

  // 运营配置 - 推荐算法权重
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoWeights, setAlgoWeights] = useState<PostHotRankWeight[]>([]);

  // 数据分析 - KPI 与图表
  const [hotLoading, setHotLoading] = useState(false);
  const [hotPosts, setHotPosts] = useState<PostVO[]>([]);
  const [kpi, setKpi] = useState({
    clickThroughRate: 0,
    interactionRate: 0,
    samplePostCount: 0,
  });

  const efficiencyChartRef = useRef<HTMLDivElement | null>(null);
  const topPostsChartRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const efficiencyChartInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPostsChartInstance = useRef<any>(null);

  const loadAdminPosts = useCallback(async () => {
    setPostTableLoading(true);
    try {
      const res = await postApi.queryPosts(
        {
          title: postSearchForm.title,
          author: '',
          tags: '',
          status: postSearchForm.status ?? undefined,
        },
        1,
        20
      );
      if (res.code === 200) {
        const page = res.data as PageResult<PostVO>;
        setAdminPostList(page.rows);
      } else {
        Message.error(res.message || '加载运营博文列表失败');
      }
    } catch (error) {
      console.error('loadAdminPosts error:', error);
      Message.error('加载运营博文列表失败');
    } finally {
      setPostTableLoading(false);
    }
  }, [postSearchForm]);

  const handlePostSearch = useCallback(() => {
    loadAdminPosts();
  }, [loadAdminPosts]);

  const handlePostReset = useCallback(() => {
    setPostSearchForm({ title: '', status: null });
  }, []);

  const renderCharts = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posts: any[],
    currentKpi: { clickThroughRate: number; interactionRate: number }
  ) => {
    if (!echarts) {
      console.warn('ECharts 未加载，请确认 index.html 中已引入 CDN 脚本');
      return;
    }

    if (efficiencyChartRef.current) {
      if (!efficiencyChartInstance.current) {
        efficiencyChartInstance.current = echarts.init(efficiencyChartRef.current);
      }
      efficiencyChartInstance.current.setOption({
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
      });
    }

    if (topPostsChartRef.current) {
      if (!topPostsChartInstance.current) {
        topPostsChartInstance.current = echarts.init(topPostsChartRef.current);
      }
      const titles = posts.map((p: { title: string }) => p.title);
      const views = posts.map((p: { viewCount?: number }) => p.viewCount || 0);
      const likes = posts.map((p: { likeCount?: number }) => p.likeCount || 0);

      topPostsChartInstance.current.setOption({
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
      });
    }
  }, []);

  const handleResize = useCallback(() => {
    if (efficiencyChartInstance.current) {
      efficiencyChartInstance.current.resize();
    }
    if (topPostsChartInstance.current) {
      topPostsChartInstance.current.resize();
    }
  }, []);

  // Combined hot posts load + KPI calc + chart render
  const loadHotPostsWithKpi = useCallback(async () => {
    setHotLoading(true);
    try {
      const res = await postHotRankApi.listHotPosts(10);
      if (res.code === 200) {
        const posts = res.data || [];
        setHotPosts(posts);

        // Calculate KPI
        if (!posts.length) {
          const emptyKpi = {
            clickThroughRate: 0,
            interactionRate: 0,
            samplePostCount: 0,
          };
          setKpi(emptyKpi);
          renderCharts(posts, emptyKpi);
        } else {
          let totalView = 0;
          let totalClick = 0;
          let totalInteraction = 0;

          posts.forEach((post: { viewCount?: number; likeCount?: number; commentCount?: number; collectCount?: number; shareCount?: number }) => {
            const view = post.viewCount || 0;
            const like = post.likeCount || 0;
            const comment = post.commentCount || 0;
            const collect = post.collectCount || 0;
            const share = post.shareCount || 0;

            totalView += view;
            totalClick += like + collect + share;
            totalInteraction += like + comment + collect + share;
          });

          const newKpi = {
            clickThroughRate: totalView === 0 ? 0 : (totalClick / totalView) * 100,
            interactionRate: totalView === 0 ? 0 : (totalInteraction / totalView) * 100,
            samplePostCount: posts.length,
          };
          setKpi(newKpi);
          renderCharts(posts, newKpi);
        }
      } else {
        Message.error(res.message || '加载热门博文数据失败');
      }
    } catch (error) {
      console.error('loadHotPosts error:', error);
      Message.error('加载热门博文数据失败');
    } finally {
      setHotLoading(false);
    }
  }, [renderCharts]);

  // Reload posts when search form changes after reset
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadAdminPosts();
  }, [postSearchForm, loadAdminPosts]);

  const isPinned = (row: PostVO) => {
    return row.weight != null && row.weight > 1;
  };

  const handlePinPost = useCallback(async (row: PostVO) => {
    Modal.confirm({
      title: '置顶确认',
      content: `确认将《${row.title}》设置为置顶内容吗？该操作会影响推荐排序。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await postAlgorithmAdminApi.pinPost(row.id);
          if (res.code === 200) {
            Message.success('已设置为置顶内容');
            loadAdminPosts();
          } else {
            Message.error(res.message || '置顶失败');
          }
        } catch (error) {
          console.error('pin post error:', error);
          Message.error('置顶失败');
        }
      },
    });
  }, [loadAdminPosts]);

  const handleUnpinPost = useCallback(async (row: PostVO) => {
    Modal.confirm({
      title: '取消置顶确认',
      content: `确认取消《${row.title}》的置顶状态吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await postAlgorithmAdminApi.unpinPost(row.id);
          if (res.code === 200) {
            Message.success('已取消置顶');
            loadAdminPosts();
          } else {
            Message.error(res.message || '取消置顶失败');
          }
        } catch (error) {
          console.error('unpin post error:', error);
          Message.error('取消置顶失败');
        }
      },
    });
  }, [loadAdminPosts]);

  const handleBlockPost = useCallback(async (row: PostVO) => {
    Modal.confirm({
      title: '屏蔽确认',
      content: `确认屏蔽《${row.title}》吗？屏蔽后将不再参与推荐和常规曝光。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await postApi.updatePostStatus(row.id, PostStatusEnum.RECYCLED);
          if (res.code === 200) {
            Message.success('已屏蔽该内容');
            loadAdminPosts();
            loadHotPostsWithKpi();
          } else {
            Message.error(res.message || '屏蔽失败');
          }
        } catch (error) {
          console.error('block post error:', error);
          Message.error('屏蔽失败');
        }
      },
    });
  }, [loadAdminPosts, loadHotPostsWithKpi]);

  const handleUnblockPost = useCallback(async (row: PostVO) => {
    Modal.confirm({
      title: '取消屏蔽确认',
      content: `确认恢复《${row.title}》的推荐与曝光吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await postApi.updatePostStatus(row.id, PostStatusEnum.PUBLISHED);
          if (res.code === 200) {
            Message.success('已取消屏蔽');
            loadAdminPosts();
            loadHotPostsWithKpi();
          } else {
            Message.error(res.message || '取消屏蔽失败');
          }
        } catch (error) {
          console.error('unblock post error:', error);
          Message.error('取消屏蔽失败');
        }
      },
    });
  }, [loadAdminPosts, loadHotPostsWithKpi]);

  const loadAlgoWeights = useCallback(async () => {
    setAlgoLoading(true);
    try {
      const res = await postAlgorithmAdminApi.listWeights();
      if (res.code === 200) {
        setAlgoWeights(res.data || []);
      } else {
        Message.error(res.message || '加载算法权重失败');
      }
    } catch (error) {
      console.error('loadAlgoWeights error:', error);
      Message.error('加载算法权重失败');
    } finally {
      setAlgoLoading(false);
    }
  }, []);

  const handleUpdateAlgoWeight = useCallback(async (row: PostHotRankWeight) => {
    try {
      const res = await postAlgorithmAdminApi.updateWeight(row.id, row.metricValue) as unknown as { code: number; message?: string };
      if (res.code === 200) {
        Message.success('已更新算法权重');
        loadAlgoWeights();
        loadHotPostsWithKpi();
      } else {
        Message.error(res.message || '更新算法权重失败');
      }
    } catch (error) {
      console.error('update weight error:', error);
      Message.error('更新算法权重失败');
    }
  }, [loadAlgoWeights, loadHotPostsWithKpi]);

  // Initial load
  useEffect(() => {
    loadAdminPosts();
    loadAlgoWeights();
    loadHotPostsWithKpi();
  }, []);

  // Resize handler
  useEffect(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (efficiencyChartInstance.current) {
        efficiencyChartInstance.current.dispose();
        efficiencyChartInstance.current = null;
      }
      if (topPostsChartInstance.current) {
        topPostsChartInstance.current.dispose();
        topPostsChartInstance.current = null;
      }
    };
  }, [handleResize]);

  const postColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      align: 'center' as const,
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
      align: 'center' as const,
      render: (_: unknown, record: PostVO) => {
        const status = record.status as PostStatusEnum;
        const color = statusTagColorMap[status] || 'default';
        const label = statusLabelMap[status] || status;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '阅读',
      dataIndex: 'viewCount',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '运营操作',
      width: 210,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: PostVO) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {isPinned(record) ? (
            <Button
              size="small"
              type="primary"
              status="warning"
              onClick={() => handleUnpinPost(record)}
            >
              取消置顶
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              onClick={() => handlePinPost(record)}
            >
              置顶
            </Button>
          )}
          {record.status === PostStatusEnum.RECYCLED ? (
            <Button
              size="small"
              type="primary"
              status="success"
              onClick={() => handleUnblockPost(record)}
            >
              取消屏蔽
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              status="danger"
              onClick={() => handleBlockPost(record)}
            >
              屏蔽
            </Button>
          )}
        </div>
      ),
    },
  ];

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
      align: 'center' as const,
      render: (_: unknown, record: PostHotRankWeight) => (
        <InputNumber
          value={record.metricValue}
          min={0}
          max={100}
          step={0.1}
          size="small"
          onChange={(value) => {
            const updated = algoWeights.map((w) =>
              w.id === record.id ? { ...w, metricValue: value } : w
            );
            setAlgoWeights(updated);
          }}
        />
      ),
    },
    {
      title: '操作',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: PostHotRankWeight) => (
        <Button
          size="small"
          type="primary"
          onClick={() => handleUpdateAlgoWeight(record)}
        >
          保存
        </Button>
      ),
    },
  ];

  const hotColumns = [
    {
      title: '排名',
      width: 70,
      align: 'center' as const,
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
      align: 'center' as const,
    },
    {
      title: '曝光(阅读)',
      dataIndex: 'viewCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '评论',
      dataIndex: 'commentCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '收藏',
      dataIndex: 'collectCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '分享',
      dataIndex: 'shareCount',
      width: 90,
      align: 'center' as const,
    },
    {
      title: '热度分',
      dataIndex: 'hotScore',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, record: PostVO) =>
        record.hotScore != null ? record.hotScore.toFixed(2) : '-',
    },
  ];

  return (
    <div className="post-monitor">
      <Card className="header-card">
        <div className="header-content">
          <div className="title-section">
            <h2>博文数据监控</h2>
            <p className="subtitle">
              统一监控推荐效果与内容表现，支持运营配置与推荐策略调优
            </p>
          </div>
        </div>
      </Card>

      <Grid.Row gutter={20} className="top-row">
        <Grid.Col span={10}>
          <Card className="ops-card">
            <div className="card-header">
              <span className="card-title">运营配置</span>
              <span className="card-subtitle">内容排序与推荐策略参数</span>
            </div>

            <Tabs
              activeTab={activeOpsTab}
              onChange={(key) => setActiveOpsTab(key as 'content' | 'algorithm')}
            >
              <Tabs.TabPane key="content" title="内容运营">
                <Form layout="inline" className="search-form">
                  <Form.Item label="标题">
                    <Input
                      value={postSearchForm.title}
                      onChange={(value) =>
                        setPostSearchForm((prev) => ({ ...prev, title: value }))
                      }
                      placeholder="博文标题"
                      allowClear
                      onPressEnter={handlePostSearch}
                    />
                  </Form.Item>
                  <Form.Item label="状态">
                    <Select
                      value={postSearchForm.status ?? undefined}
                      onChange={(value) =>
                        setPostSearchForm((prev) => ({
                          ...prev,
                          status: (value as PostStatusEnum) ?? null,
                        }))
                      }
                      placeholder="全部"
                      allowClear
                      style={{ width: 140 }}
                    >
                      <Select.Option value={PostStatusEnum.PUBLISHED}>
                        已发布
                      </Select.Option>
                      <Select.Option value={PostStatusEnum.AUDITING}>
                        审核中
                      </Select.Option>
                      <Select.Option value={PostStatusEnum.DRAFT}>
                        草稿
                      </Select.Option>
                      <Select.Option value={PostStatusEnum.PRIVATE}>
                        仅自己可见
                      </Select.Option>
                      <Select.Option value={PostStatusEnum.RECYCLED}>
                        回收站
                      </Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" onClick={handlePostSearch}>
                      查询
                    </Button>
                    <Button onClick={handlePostReset}>重置</Button>
                  </Form.Item>
                </Form>

                <Table
                  loading={postTableLoading}
                  columns={postColumns}
                  data={adminPostList}
                  size="small"
                  border
                  className="ops-post-table"
                  scroll={{ y: 320 }}
                  rowKey="id"
                />
              </Tabs.TabPane>

              <Tabs.TabPane key="algorithm" title="推荐策略">
                <div className="algo-description">
                  <p>
                    调整热度算法各指标权重，用于影响推荐列表排序结果。建议小步调整并观察数据变化。
                  </p>
                </div>
                <Table
                  loading={algoLoading}
                  columns={algoColumns}
                  data={algoWeights}
                  border
                  size="small"
                  className="algo-table"
                  scroll={{ y: 360 }}
                  rowKey="id"
                />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Grid.Col>

        <Grid.Col span={14}>
          <Card className="kpi-card">
            <div className="card-header">
              <span className="card-title">推荐效果数据看板</span>
              <span className="card-subtitle">
                基于近期热门博文样本，监控推荐质量表现
              </span>
            </div>

            <Grid.Row gutter={16} className="kpi-row">
              <Grid.Col span={8}>
                <div className="kpi-item">
                  <div className="kpi-label">整体点击率</div>
                  <div className="kpi-value">
                    {kpi.clickThroughRate.toFixed(2)}%
                  </div>
                  <div className="kpi-desc">点击行为 / 曝光量</div>
                </div>
              </Grid.Col>
              <Grid.Col span={8}>
                <div className="kpi-item">
                  <div className="kpi-label">整体互动率</div>
                  <div className="kpi-value">
                    {kpi.interactionRate.toFixed(2)}%
                  </div>
                  <div className="kpi-desc">点赞、评论、收藏等 / 曝光量</div>
                </div>
              </Grid.Col>
              <Grid.Col span={8}>
                <div className="kpi-item">
                  <div className="kpi-label">样本博文数</div>
                  <div className="kpi-value">{kpi.samplePostCount}</div>
                  <div className="kpi-desc">当前参与统计的热门博文数量</div>
                </div>
              </Grid.Col>
            </Grid.Row>

            <div className="charts-wrapper">
              <div ref={efficiencyChartRef} className="chart-panel" />
              <div ref={topPostsChartRef} className="chart-panel" />
            </div>
          </Card>
        </Grid.Col>
      </Grid.Row>

      <Card className="bottom-card">
        <div className="card-header">
          <span className="card-title">热门博文表现明细</span>
          <span className="card-subtitle">对比不同内容在推荐位上的表现</span>
        </div>

        <Table
          loading={hotLoading}
          columns={hotColumns}
          data={hotPosts}
          border
          size="small"
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default PostMonitor;
