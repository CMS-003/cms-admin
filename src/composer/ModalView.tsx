import { Modal } from 'antd';
import { TemplateView } from './TemplateView';

type ModalViewProps = {
  /** 要展示的模板 id（对应 widget.method） */
  template_id: string;
  /**
   * 传给内嵌模板的 query，形如 `'?id=123'`。
   * TemplateView 会把它解析进自己的 `page.query`，模板里的 Form 用 `useQuery('id')` 读它拉详情。
   */
  path?: string;
  title?: string;
  width?: number;
  /** 关闭。TemplateView 的 close 也指向它（模板内部调用 close() 就是关这个框） */
  onClose: () => void;
};

/**
 * 基于 TemplateView 的弹框。
 *
 * 对应旧版的 `groups/modal.tsx`（那个是包 `AutoPage`），这里是包 `TemplateView`。
 * 相比旧版多做了两件事：
 *
 * 1. **`.node` 样式不用额外引入**：样式统一在 `composer/TemplateView.tsx` 里
 *    `import './styles.css'` —— TemplateView 是所有渲染路径（编辑器 / 动态页 / 本弹框）的
 *    公共入口，之前把它挂在编辑器入口页上，导致不走编辑器的路径
 *    （弹框、动态页）因为懒加载拿不到这份样式，`.node` 全丢。
 *
 * 2. **给内嵌 TemplateView 一个确定高度**：TemplateView 的壳是 `flex: 1`，Form 内部是 `height: 100%`，
 *    是一条 `flex: 1` 撑出来的链。Modal 的 body 高度自适应，这条链会断在
 *    `flex-basis: 0%` 上塌成 0（表单直接看不见）。所以外面套一层定高的 flex 容器。
 *
 * `destroyOnHidden`：关掉即卸载 TemplateView（连带它的 tree store / page），
 * 下次打开是干净的一份，重新拉数据。
 */
export function ModalView({ template_id, path = '', title, width = 720, onClose }: ModalViewProps) {
  return (
    <Modal
      title={title || (path ? '修改' : '创建')}
      open
      destroyOnHidden
      footer={null}
      onCancel={onClose}
      width={width}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
        <TemplateView
          template_id={template_id}
          mode='preview'
          path={path}
          close={onClose}
        />
      </div>
    </Modal>
  );
}
