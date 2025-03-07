import { types, ISimpleType, IMSTArray } from 'mobx-state-tree'
import storage from '../storage'

const TagPage = types.model({
  openedPages: types.array(types.string),
  currentPage: types.optional(types.string, '/dashboard'),
  defaultOpened: types.array(types.string)
}).views(self => ({

})).actions((self) => ({
  setOpenedPages(items: IMSTArray<ISimpleType<string>>) {
    self.openedPages = items;
    storage.setKey('opened-tags', items)
  },
  addPage(tag: string) {
    if (!self.openedPages.includes(tag)) {
      self.openedPages.push(tag)
      return true
    }
    return false
  },
  closePage(tag: string) {
    const index = self.openedPages.findIndex(item => item === tag)
    if (index !== -1) {
      self.openedPages.splice(index, 1)
    }
  },
  setCurrentPage(tag: string) {
    const path = tag && self.openedPages.includes(tag) ? tag : '/dashboard';
    storage.setKey('current-tag', path);
    self.currentPage = path;
  },
}))
export default TagPage;