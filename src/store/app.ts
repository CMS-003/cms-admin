import { types } from 'mobx-state-tree'

const app = types.model('app', {
  isSignIn: types.boolean,
  lastVisitedAt: types.Date,
  isDebug: types.boolean,
}).actions(self => ({
  setIsSignIn(bool: boolean) {
    self.isSignIn = bool
  }
}));

export default app;