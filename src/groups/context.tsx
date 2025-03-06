import { IPageInfo } from '@/types';
import { createContext, useContext } from 'react'

export const PageContext = createContext<IPageInfo>({
  template_id: '',
  path: '',
  param: {},
  query: {},
  setQuery(){

  },
});
export function usePageContext() {
  return useContext(PageContext);
}

export const TitleContext = createContext<(path: string, title: string) => void>(() => { });
export function useSetTitleContext() {
  return useContext(TitleContext);
}