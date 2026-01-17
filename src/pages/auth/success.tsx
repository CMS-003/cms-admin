import { Link } from 'react-router-dom'

export default function SuccessPage() {
  return <div style={{ width: '50%', margin: '0 auto', textAlign: 'center', paddingTop: 100 }}>
    授权成功,<Link to={'/dashborad'}>回到首页</Link>
  </div>
}