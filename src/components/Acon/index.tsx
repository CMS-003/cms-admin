import {
  DeleteOutlined,
  FormOutlined,
  UploadOutlined,
  PlusOutlined,
  CloseOutlined,
  CopyOutlined,
  DragOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  SearchOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  MinusCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from '@ant-design/icons'

const icons = {
  DeleteOutlined,
  FormOutlined,
  UploadOutlined,
  PlusOutlined,
  CloseOutlined,
  CopyOutlined,
  DragOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  SearchOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  MinusCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
}

export default function Acon(prop: { icon: string, size?: number, title?: string, hidden?: boolean, onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void }) {
  const Image: any = icons[prop.icon as keyof typeof icons]
  if (Image) {
    return <span style={{ marginRight: 10 }}><Image /></span>
  }
  return null;
}