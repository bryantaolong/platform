import { useNavigate } from 'react-router-dom'
import { Button } from '@arco-design/web-react'
import './NotFound.css'

export default function NotFound() {
  const navigate = useNavigate()

  const goHome = () => {
    navigate('/')
  }

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在。</p>
      <Button type="primary" onClick={goHome}>返回首页</Button>
    </div>
  )
}
