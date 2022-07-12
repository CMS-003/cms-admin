import { types } from 'mobx-state-tree'
import constant from '../constant'
import storage from '../storage'

const user = types.model('app', {
  info: types.maybe(types.model({
    id: types.string,
    avatar: types.string,
    account: types.string,
  })),
  token: types.model({
    [constant.ACCESS_TOKEN]: types.optional(types.string, ''),
    [constant.REFRESH_TOKEN]: types.optional(types.string, ''),
  }),
  im_signatue: types.optional(types.string, ''),
}).actions(self => ({
  setAccessToken(token: string) {
    storage.setKey(constant.ACCESS_TOKEN, token);
  },
  setRefreshToken(token: string) {
    storage.setKey(constant.REFRESH_TOKEN, token);
  },
  setIMSignature(signature: string) {
    self.im_signatue = signature
    storage.setKey('im_signature', signature)
  },
}));

export default user;