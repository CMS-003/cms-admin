import { types, IType, IMSTArray, SnapshotIn, SnapshotOut } from 'mobx-state-tree'
import { IProject } from '@/types'

export const ProjectItem: any = types.model('ProjectItem', {
  _id: types.string,
  title: types.optional(types.string, ''),
  name: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  createdAt: types.maybe(types.string),
  updatedAt: types.maybe(types.string),
  status: types.optional(types.number, 1),
  user_id: types.optional(types.string, ''),
}).actions(self => ({

}));

const projectList = types.model({
  list: types.array(ProjectItem),
}).views(self => ({
  getList(): IProject[] {
    return self.list.toJSON();
  },
})).actions((self) => ({
  setList(items: IProject[]) {
    items.unshift({ title: '全部', name: '', _id: '', })
    self.list = items as IMSTArray<IType<SnapshotIn<IProject>, SnapshotOut<IProject>, IProject>>;
  },
  async fetch() {

  },
}))
export default projectList;