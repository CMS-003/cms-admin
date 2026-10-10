import { createContext, useContext } from 'react';
import type { IMode, IPageInfo } from '@/types';

/**
 * 页面级上下文：一个模板页渲染时「整页共用」的三样东西。
 * 由渲染模板的组件（`composer/TemplateView`）提供，节点组件用 hook 取。
 *
 * 三个都是**低频**变化的（mode 切换 / 页面跳转 / 标题），直接从 context 读即可；
 * 高频的 source / query 在 `./data`，编辑器状态在 `./tree`。
 */

/** 页面信息：模板 id / 路径 / 查询条件 / 关闭。身份稳定（同一实例只改字段） */
export const PageContext = createContext<IPageInfo>({
  template_id: '',
  path: '',
  param: {},
  query: {},
  setQuery() { },
  close() { },
});

export function usePage(): IPageInfo {
  return useContext(PageContext);
}

/** 编辑或预览 */
export const ModeContext = createContext<IMode>('edit');

export function useMode(): IMode {
  return useContext(ModeContext);
}

/** 设置页签标题（多页签外壳提供，页面用 `useSetTitleContext()` 拿到后改标题） */
export const TitleContext = createContext<(path: string, title: string) => void>(() => { });

export function useSetTitleContext() {
  return useContext(TitleContext);
}
