/**
 * 拖拽预览：把被拖元素（画布节点的根 div，或组件库里的 palette-item）
 * 的 DOM 深拷贝一份，交给 DragOverlay 显示。
 *
 * 为什么是「克隆 DOM」而不是「重新渲染一个节点组件」：
 * - 组件库里的项在画布上根本没有对应节点，重新渲染要造一个假节点、还得喂
 *   actions / bindings / page / source 一整套 props，成本和风险都不划算；
 * - 画布内的节点重新渲染会多出一份 React 树，事件、ref、MST 订阅都对不上。
 * 深拷贝是「所见即所得」—— 拖起来的就是刚才看到的那块东西。
 *
 * 克隆完必须剥掉三类属性（含所有后代）：
 * - `data-node-id` / `data-node-type`：几何测量靠 `canvas.querySelector('[data-node-id=...]')`
 *   取节点元素，多出一份同名属性会让取到的那份变成浮在鼠标下的克隆体（rect 全错）。
 *   当前 DragOverlay 挂在 canvas 外面所以碰不到，但这是纯防御 —— 挪一下结构就会踩。
 * - `data-mark`：那是编辑态选框的开关，克隆体不该自带一个红/蓝虚线框。
 *
 * 尺寸不用在这里设：DragOverlay 的容器会被 dnd-kit 定成和源元素一样的宽高
 * （box-sizing 的差异 dnd-kit 也补偿过了），styles.css 里给克隆体 width/height 100% 即可。
 */
export function createDragPreview(source: Element | null | undefined): HTMLElement | null {
  if (!source) return null;
  const clone = source.cloneNode(true) as HTMLElement;

  const strip = (el: Element) => {
    el.removeAttribute('data-node-id');
    el.removeAttribute('data-node-type');
    el.removeAttribute('data-mark');
  };
  strip(clone);
  clone
    .querySelectorAll('[data-node-id],[data-node-type],[data-mark]')
    .forEach(strip);

  return clone;
}
