import { types } from 'mobx-state-tree'
import storage from '../storage'

const app = types.model('app', {
  isSignIn: types.boolean,
  lastVisitedAt: types.Date,
  isDebug: types.boolean,
  im_sdk_appid: types.optional(types.string, ''),
  im_user_id: types.optional(types.string, ''),
  phone: types.optional(types.string, ''),
  password: types.optional(types.string, ''),
}).views(self => ({
  isLocal() {
    return self.im_sdk_appid === '1400701118'
  },
  getBaseHost() {
    return self.im_sdk_appid === '1400701118' ? 'http://localhost:8993' : 'https://m.fengshows.com/msgservice'
  }
})).actions(self => ({
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
  },
  setKey(key: 'phone' | 'password' | 'im_sdk_appid' | 'im_user_id', val: string) {
    storage.setKey(key, val);
    self[key] = val;
  }
}));

export default app;