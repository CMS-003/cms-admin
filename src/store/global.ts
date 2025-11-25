import { get } from 'lodash';
import { IAnyModelType, types } from 'mobx-state-tree'

const global = types.model('global', {
  config: types.frozen({}),
}).actions(self => ({
  getValue(path: string) {
    return get(self.config, path, null);
  }
}))
export default global;