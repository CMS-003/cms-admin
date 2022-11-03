import { IModelType, IStateTreeNode, types, _NotCustomized, ISimpleType, IMaybe, IOptionalIType, ValidOptionalValues } from 'mobx-state-tree'
import constant from '../constant'
import storage from '../storage'

const user = types.model('app', {
  info: types.maybe(types.model({
    id: types.string,
    avatar: types.string,
    account: types.string,
    nickname: types.optional(types.string, ''),
  })),
  token: types.model({
    [constant.ACCESS_TOKEN]: types.optional(types.string, ''),
    [constant.REFRESH_TOKEN]: types.optional(types.string, ''),
  })
}).views(self => ({
  getAccessToken() {
    return self.token[constant.ACCESS_TOKEN] || ''
  },
  getRefreshToken() {
    return self.token[constant.REFRESH_TOKEN] || ''
  }
})).actions(self => ({
  setAccessToken(token: string) {
    self.token[constant.ACCESS_TOKEN] = token;
    storage.setKey(constant.ACCESS_TOKEN, token);
  },
  setRefreshToken(token: string) {
    self.token[constant.REFRESH_TOKEN] = token;
    storage.setKey(constant.REFRESH_TOKEN, token);
  },
  setInfo(info: ({
    id: string;
    avatar: string;
    account: string;
    nickname: string;
  } & IStateTreeNode<IMaybe<IModelType<{
    id: ISimpleType<string>;
    avatar: ISimpleType<string>;
    account: ISimpleType<string>;
    nickname: IOptionalIType<ISimpleType<string>, ValidOptionalValues>;
  }, {}, _NotCustomized, _NotCustomized>>>) | undefined) {
    if (info) {
      self.info = info
    }
  },
}));

export default user;