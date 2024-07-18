import {
  HomeOutlined,
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
  RadiusSettingOutlined,
  FolderOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  InsertRowLeftOutlined,
  ProjectOutlined,
  SnippetsOutlined,
  SafetyOutlined,
} from '@ant-design/icons'

const icons = {
  HomeOutlined,
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
  RadiusSettingOutlined,
  FolderOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  InsertRowLeftOutlined,
  ProjectOutlined,
  SnippetsOutlined,
  SafetyOutlined,
}

export default function Acon(prop: { icon: string, size?: number, title?: string, hidden?: boolean, style?: React.CSSProperties, onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void }) {
  const Image: any = icons[prop.icon as keyof typeof icons]
  if (Image) {
    return <span style={prop.style || { margin: 10 }} onClick={prop.onClick}><Image /></span>
  }
  return null;
}