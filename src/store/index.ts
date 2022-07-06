import IApp from './app'
import IUser from './user'
import IMenu from './menu'
import IComponent from './component'
import { types } from 'mobx-state-tree';

// app状态
const app = IApp.create({
  isSignIn: false,
  isDebug: false,
  lastVisitedAt: 0,
});
// 用户信息状态
const user = IUser.create({ token: {} });
const menu = IMenu.create();
const component = IComponent.create();

const store = {
  app,
  user,
  menu,
  component,
}

export default store;