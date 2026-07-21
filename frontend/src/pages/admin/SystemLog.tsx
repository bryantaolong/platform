import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Divider,
  Empty,
  InputNumber,
  Message,
  Select,
  Space
} from '@arco-design/web-react'
import * as logApi from '@/api/admin/log'
import './SystemLog.css'

const SystemLog = () => {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [lineCount, setLineCount] = useState(200)
  const [logFiles, setLogFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')

  const logsText = useMemo(() => logs.join('\n'), [logs])

  const loadFiles = async () => {
    try {
      const res = await logApi.listLogFiles()
      if (res.code === 200) {
        const files = res.data || []
        setLogFiles(files)
        if (!selectedFile && files.length > 0) {
          setSelectedFile(files[0])
        }
      } else {
        Message.error(res.message || '加载日志文件列表失败')
      }
    } catch (error) {
      console.error('加载日志文件列表失败:', error)
      Message.error('加载日志文件列表失败，请稍后重试')
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await logApi.listLatestLogs(lineCount, selectedFile || undefined)
      if (res.code === 200) {
        setLogs(res.data || [])
      } else {
        Message.error(res.message || '加载日志失败')
      }
    } catch (error) {
      console.error('加载系统日志失败:', error)
      Message.error('加载系统日志失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadFiles()
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedFile) {
      loadLogs()
    }
  }, [selectedFile])

  return (
    <div className="system-log">
      <Card className="log-card">
        <div className="log-header">
          <div className="title-section">
            <h2>系统日志</h2>
            <p className="subtitle">查看后台应用运行日志，仅管理员可访问</p>
          </div>
          <Space className="actions">
            <Select
              value={selectedFile}
              onChange={(value) => setSelectedFile(value)}
              placeholder="选择日志文件"
              className="file-select"
              style={{ minWidth: 200 }}
            >
              {logFiles.map((file) => (
                <Select.Option key={file} value={file}>
                  {file}
                </Select.Option>
              ))}
            </Select>
            <span className="lines-label">行数：</span>
            <InputNumber
              value={lineCount}
              onChange={(value) => setLineCount(value as number)}
              min={50}
              max={2000}
              step={50}
            />
            <Button type="primary" loading={loading} onClick={loadLogs}>
              刷新
            </Button>
          </Space>
        </div>

        <Divider />

        {!loading && logs.length === 0 ? (
          <Empty description="暂无日志数据" />
        ) : (
          <div className="log-content">
            <pre>
              <code>{logsText}</code>
            </pre>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SystemLog
