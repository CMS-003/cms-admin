import shttp, { BaseResultWrapper, BaseResultsWrapper } from "../utils/shttp";
import store from '../store'
import constant from '../constant'


export default {
  SignIn: async (data: { account: string, pass: string }) => {
    const result: any = await shttp.post("/api/v1/oauth/sign-in", data)
    store.user.setAccessToken(result[constant.ACCESS_TOKEN])
    store.user.setRefreshToken(result[constant.REFRESH_TOKEN])
    store.app.setIsSignIn(true)
    return result;
  },
  getProfile: async <T>() => {
    const result = await shttp.get<BaseResultWrapper<T>>('/api/v1/user/profile').header({ 'X-Token': store.user.token[constant.ACCESS_TOKEN] });
    return result
  },
  getProjects: async <T>() => {
    const result = await shttp.get<BaseResultsWrapper<T>>('/api/v1/user/projects').header({ 'X-Token': store.user.token[constant.ACCESS_TOKEN] });
    return result
  }
}