import { IBaseCom } from "@/types";
import { useMode } from "@/context";
import { GripVertical } from "lucide-react";
import Acon from '@/components/Acon'
import styled, { keyframes } from 'styled-components'
import { FullHeight } from '@/components/style'
import { useNavigate } from "react-router-dom";
import { Carousel } from 'antd';
import { useResourceList } from "../_shared/useResourceList";

/**
 * 轮播 Banner。
 *
 * 用 antd 自带的 Carousel（底层是 @ant-design/react-slick）：
 * 自动播放 + 无限循环 + 指示点，不再引第三方轮播库。
 *
 * 外观三件事都在下面的样式里：
 * - 指示点挪到**右下角**，并且一律是**小圆圈**（antd 默认是「会变长的胶囊」）
 * - 标题**压在图片上**：底部一层由深到透的黑色渐变打底，白字才立得住
 * - 没数据时是**骨架图**（同样尺寸的占位块 + 流光动画），不是空白
 *
 * 数据来源看 `widget.from`（见 `_shared/useResourceList`）：
 * 一般是 `api`（接口拉），也支持 `data`（节点自己的 resources）。
 */
const Wrap = styled.div`
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background-color: #eee;

  /* ---------- 指示点：右下角的小圆圈 ---------- */
  .slick-dots {
    justify-content: flex-end !important;
    padding-inline-end: 16px;
    bottom: 10px;
  }
  .slick-dots li,
  .slick-dots li.slick-active {
    width: 8px;
    height: 8px;
    margin-inline: 4px;
  }
  .slick-dots li button {
    opacity: .5;
  }
  .slick-dots li.slick-active button {
    opacity: 1;
  }
`
const shimmer = keyframes`
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
`
/** 图与骨架共用同一套尺寸，换上去不会跳一下 */
const slideBox = `
  position: relative;
  width: 100%;
  height: 180px;
  background-size: cover;
  background-position: center center;
`
const Slide = styled.div<{ $src?: string }>`
  ${slideBox}
  background-color: #dcdcdc;
  background-image: ${({ $src }) => ($src ? `url(${$src})` : 'none')};
`
/** 加载中的占位：尺寸跟真图完全一致，只是换成流光 */
const SlideSkeleton = styled.div`
  ${slideBox}
  background-color: #e2e2e2;
  background-image: linear-gradient(90deg, #e2e2e2 25%, #f4f4f4 37%, #e2e2e2 63%);
  background-size: 400% 100%;
  animation: ${shimmer} 1.4s ease infinite;
`
const Caption = styled.div`
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: 28px 16px 14px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  /* 压在图上的那一层底：透明 → 深黑，字才看得清 */
  background: linear-gradient(to top, rgba(0, 0, 0, .65), rgba(0, 0, 0, 0));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
const Actions = styled.div`
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 16;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 10px;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  background: rgba(0, 0, 0, .35);
`
const More = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  &:hover { opacity: .75; }
`

export default function CBanner({ self, bindings }: IBaseCom) {
  const mode = useMode();
  const navigate = useNavigate();
  const { items, loading, remote, reload } = useResourceList(self);
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  const more = (self.attrs?.more as string) || '';
  const showRefresh = !!self.attrs?.refresh && remote;

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <FullHeight style={{ flex: 1, minWidth: 0 }}>
      <Wrap>
        {loading ? (
          // 数据在路上：占位 + 流光
          <SlideSkeleton />
        ) : items.length > 0 ? (
          <Carousel
            autoplay
            autoplaySpeed={4000}
            dotPlacement="bottom"
            // 轮播自己别抢指针事件：编辑态整块要能被拖（preview 下也无妨）
            draggable={false}
          >
            {items.map(item => (
              <Slide key={item.key} $src={item.image}>
                {item.title && <Caption>{item.title}</Caption>}
              </Slide>
            ))}
          </Carousel>
        ) : (
          // 拉完了但一条都没有：给个静默的占位块，别再流光（那不是「在加载」）
          <Slide />
        )}
        {(showRefresh || more) && (
          <Actions>
            {showRefresh && <Acon data-no-dnd icon='RefreshCw' title='刷新' onClick={reload} />}
            {more && <More data-no-dnd onClick={() => navigate(more)}>更多</More>}
          </Actions>
        )}
      </Wrap>
    </FullHeight>
  </div>
}
