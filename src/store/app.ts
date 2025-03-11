import { types } from 'mobx-state-tree'
import storage from '../utils/storage'

const app = types.model('app', {
  isSignIn: types.boolean,
  lastVisitedAt: types.Date,
  isDebug: types.boolean,
  baseURL: types.string,
  imageLines: types.array(types.string),
  project_id: types.optional(types.string, ''),
}).views(self => ({
  get imageLine() {
    return self.imageLines[0]
  }
})).actions(self => ({
  setIsSignIn(bool: boolean) {
    self.isSignIn = bool
  },
  setProjectId(id: string) {
    self.project_id = id;
    storage.setKey('project_id', id);
  },
}));

export default app;