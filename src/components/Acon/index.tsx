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
} from '@ant-design/icons'
import React from 'react';
import styled from 'styled-components'

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
}
const Wrap = styled.span`
  cursor: pointer;
    cursor:pointer;
  &:hover { 
    opacity: 0.4;
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
    return <Wrap style={{ ...prop.style, color: prop.color }} onClick={prop.onClick}>
      <Image style={{ transform: `rotate(${prop.rotate || 0})` }} />
    </Wrap>
  }
  return null;
}