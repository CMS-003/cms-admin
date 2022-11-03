import shttp from "../utils/shttp";
import store from '../store'
import constant from '../constant'


const user = {
  SignIn: async (data: { type: string, account: string, pass: string }) => {
    const result: any = await shttp.post("/api/v1/oauth/sign-in", data)
    store.user.setAccessToken(result[constant.ACCESS_TOKEN])
    store.user.setRefreshToken(result[constant.REFRESH_TOKEN])
    store.app.setIsSignIn(true)
    return result;
  },
  SignOut: async () => {
    return await shttp.post('/api/v1/user/sign-out', {});
  },
  getProfile: async <T>() => {
    const result = await shttp.get<T>('/api/v1/user/profile')
    return result
  },
  getApps: async <T>() => {
    const result = await shttp.get<T>('/api/v1/user/apps')
    return result
  },
  sendCode: async <T>(data: { type: string, account: string }) => {
    const result = await shttp.post<T>('/api/v1/oauth/code', data);
    return result
  },
  bind: async <T>(data: { bind_token: string, type: string, account: string, area_code?: string }) => {
    const result = await shttp.post<T>('/api/v1/oauth/bind?bind_token=' + data.bind_token, data);
    return result
  }
}

export default user;