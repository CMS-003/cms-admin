import { IBaseCom, IResource } from "@/types";
import { useActions, useMode } from "@/context";
import { GripVertical } from "lucide-react";
import Acon from '@/components/Acon'
import ResourceModal from '@/components/ResourceModal';
import styled from 'styled-components'
import { Center, FullHeight } from '@/components/style'
import { useLocalProxy } from "@/utils/valtio";
import { useNavigate } from "react-router-dom";
import { Skeleton } from 'antd';
import { pick } from 'lodash-es';
import { useResourceList } from "../_shared/useResourceList";

/**
 * 卡片列表（合并了 PickCard 与 RandomCard）。
 *
 * 数据来源看 `widget.from`（见 `_shared/useResourceList`）：
 * - `data`   → 节点自己的 resources（编辑态可以直接「添加资源」）
 * - `global` → 全局配置里 widget.source 指向的那一段
 * - `api`    → widget.method + url，响应按 widget.mapping 翻译
 *
 * 两个开关都在 attrs 上：
 * - `attrs.more`：要跳去的页面视图（字符串）。非空就在标题右侧出现「更多」
 * - `attrs.refresh`：是否显示刷新（布尔）。只在真有接口（api + 地址）时出现
 */
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  padding: 5px;
  color: #555;
`
const HeaderTitle = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 400;
`
const More = styled.span`
  display: inline-flex;
  align-items: center;
  color: #a08a4b;
  cursor: pointer;
  &:hover { opacity: .7; }
`
const Content = styled.div`
  min-height: 150px;
  border-radius: 10px;
  background-color: #eee;
  padding: 10px;
`
const ScrollWrap = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  overflow-x: auto;
  box-sizing: border-box;
  height: 100%;
  &::-webkit-scrollbar {
    display: none;
  }
  &>div:first-child {
    margin-left: 0;
  }
`;
const ItemWrap = styled.div`
  width: 150px;
  display: flex;
  flex-direction: column;
  height: 150px;
  margin-left: 10px;
`
const ItemImage = styled.div<{ $src: string }>`
  width: 150px;
  height: 120px;
  background-color: #e0e0e0;
  background-image: ${({ $src }) => ($src ? `url(${$src})` : 'none')};
  background-size: cover;
  background-position: center center;
`
const ItemTitle = styled.div`
  overflow: hidden; 
  text-overflow: ellipsis; 
  display: -webkit-box; 
  -webkit-box-orient: vertical; 
  -webkit-line-clamp: 2;
  height: 34px;
  line-height: 1.2;
  margin: 5px 0;
`
const SkeletonRow = styled.div`
  display: flex;
  gap: 10px;
`
const SkeletonItem = styled.div`
  width: 150px;
  flex: 0 0 150px;
`

/** 骨架图的形状跟真卡片对齐（150 图 + 两行标题），别用通用骨架块 */
function CardSkeleton() {
  return <SkeletonRow>
    {[0, 1, 2, 3].map(i => (
      <SkeletonItem key={i}>
        <Skeleton.Image active style={{ width: 150, height: 120 }} />
        <Skeleton active title={false} paragraph={{ rows: 1, width: '100%' }} style={{ marginTop: 6 }} />
      </SkeletonItem>
    ))}
  </SkeletonRow>
}

export default function CCard({ self, bindings }: IBaseCom) {
  const mode = useMode();
  const actions = useActions();
  const navigate = useNavigate();
  const { from, items, loading, remote, reload } = useResourceList(self);
  const [localState, localStore] = useLocalProxy({
    showResourceModal: false,
  })
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  const more = (self.attrs?.more as string) || '';
  // 没有接口就没得刷新，不给假按钮
  const showRefresh = !!self.attrs?.refresh && remote;

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <FullHeight style={{ flex: 1, minWidth: 0 }}>
      <Header>
        <HeaderTitle>{self.title}</HeaderTitle>
        <HeaderActions>
          {showRefresh && <Acon data-no-dnd icon='RefreshCw' title='刷新' onClick={reload} />}
          {more && <More data-no-dnd onClick={() => navigate(more)}>更多<Acon icon='ChevronRight' /></More>}
        </HeaderActions>
      </Header>
      <Content>
        {loading
          ? <CardSkeleton />
          : <ScrollWrap>
            {items.map(item => (
              <ItemWrap key={item.key}>
                <ItemImage $src={item.image} />
                <ItemTitle>{item.title}</ItemTitle>
              </ItemWrap>
            ))}
          </ScrollWrap>}
      </Content>
      {/* 只有静态数据才谈得上「添加资源」；api / global 的数据从别处来 */}
      {mode === 'edit' && from === 'data' && (
        <Center style={{ marginTop: 5 }} onClick={() => {
          localStore.showResourceModal = true;
        }}>
          <Acon icon='CirclePlus' title='添加资源' />
        </Center>
      )}
    </FullHeight>
    {localState.showResourceModal && <ResourceModal
      show={localState.showResourceModal}
      onAdd={(d: IResource) => {
        actions.setNodeField(self, 'resources', [...(self.resources || []), pick(d, ['_id', 'title', 'cover', 'thumbnail', 'status'])])
      }}
      onClose={() => {
        localStore.showResourceModal = false
      }}
    />}
  </div>
}
