import {
  HomeOutlined,
  DeleteOutlined,
  FormOutlined,
  UploadOutlined,
  PlusOutlined,
  CloseOutlined,
  CopyOutlined,
  LinkOutlined,
  DragOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  SearchOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
  CaretRightOutlined,
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
  ProductOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  CloudDownloadOutlined,
  SettingOutlined,
  CheckOutlined,
  HolderOutlined,
  TrademarkCircleOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  ApiOutlined,
  RadarChartOutlined,
} from '@ant-design/icons'
import React from 'react';
import styled from 'styled-components'
import caption from '@/asserts/images/caption.svg'
import { IconSVG } from '../style';

const icons = {
  home: HomeOutlined,
  HomeOutlined,
  DeleteOutlined,
  delete: DeleteOutlined,
  FormOutlined,
  edit: FormOutlined,
  UploadOutlined,
  upload: UploadOutlined,
  PlusOutlined,
  add: PlusOutlined,
  CloseOutlined,
  close: CloseOutlined,
  CopyOutlined,
  copy: CopyOutlined,
  DragOutlined,
  drag: DragOutlined,
  SyncOutlined,
  sync: SyncOutlined,
  SearchOutlined,
  search: SearchOutlined,
  BarsOutlined,
  bars: BarsOutlined,
  LeftOutlined,
  left: LeftOutlined,
  RightOutlined,
  right: RightOutlined,
  CaretRightOutlined,
  caret: CaretRightOutlined,
  UserOutlined,
  user: UserOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  RadiusSettingOutlined,
  LoadingOutlined,
  loading: LoadingOutlined,
  ReloadOutlined,
  reload: ReloadOutlined,
  FolderOutlined,
  folder: FolderOutlined,
  AppstoreOutlined,
  app: AppstoreOutlined,
  SettingOutlined,
  setting: SettingOutlined,
  CheckOutlined,
  check: CheckOutlined,
  FileTextOutlined,
  InsertRowLeftOutlined,
  ProjectOutlined,
  SnippetsOutlined,
  SafetyOutlined,
  ProductOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  CloudDownloadOutlined,
  download: CloudDownloadOutlined,
  holder: HolderOutlined,
  TrademarkCircleOutlined,
  Video: VideoCameraOutlined,
  Image: PictureOutlined,
  Album: FileImageOutlined,
  Text: FontSizeOutlined,
  Caption: () => <IconSVG src={caption} />,
  LinkOutlined,
  ApiOutlined,
  Api: ApiOutlined,
  spider: RadarChartOutlined,
}
const Wrap = styled.span`
  cursor: pointer;
    cursor:pointer;
  &:hover { 
    opacity: 0.7;
    color: var(--ant-primary-color-hover);
  }
`;
export type Icon = keyof typeof icons;
export default function Acon(prop: {
  icon: Icon,
  size?: number,
  color?: React.CSSProperties['color'],
  rotate?: React.CSSProperties['rotate'],
  title?: string,
  hidden?: boolean,
  style?: React.CSSProperties,
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void,
}) {
  const Image: any = icons[prop.icon]
  if (Image && !prop.hidden) {
    return <Wrap style={{ ...prop.style, color: prop.color, fontSize: prop.size }} onClick={prop.onClick}>
      <Image style={{ transform: `rotate(${prop.rotate || 0})` }} />
    </Wrap>
  }
  return null;
}