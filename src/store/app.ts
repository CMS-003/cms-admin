import { types } from 'mobx-state-tree'
import storage from '../storage'

const app = types.model('app', {
  isSignIn: types.boolean,
  lastVisitedAt: types.Date,
  isDebug: types.boolean,
  im_sdk_appid: types.optional(types.string, ''),
  im_user_id: types.optional(types.string, '')
}).actions(self => ({
  setIsSignIn(bool: boolean) {
    self.isSignIn = bool
  },
  setIMSdkAppId(id: string) {
    storage.setKey('im_sdk_appid', id);
    self.im_sdk_appid = id;
  },
  setIMUserId(id: string) {
    storage.setKey('im_user_id', id);
    self.im_user_id = id;
  }
}));

export default app;