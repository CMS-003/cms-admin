import shttp from "../utils/shttp";
import store from '../store'
import constant from '../constant'


const user = {
  SignIn: async (data: { type: string, account: string, value: string }) => {
    const result: any = await shttp.post("/api/v1/oauth/sign-in", data)
    store.user.setAccessToken(result[constant.ACCESS_TOKEN])
    store.user.setRefreshToken(result[constant.REFRESH_TOKEN])
    store.app.setIsSignIn(true)
    return result;
  },
  SignOut: async () => {
    const result = await shttp.post('/api/v1/users/sign-out', {});
    store.user.setAccessToken('');
    store.user.setRefreshToken('');
    store.app.setIsSignIn(false);
    return result;
  },
  getProfile: async <T>() => {
    return await shttp.get<T>('/api/v1/users/profile').then()
  },
  getApps: async <T>() => {
    const result = await shttp.get<T>('/api/v1/user/apps')
    return result
  },
  sendCode: async <T>(data: { type: string, account: string }) => {
    const result = await shttp.post<T>('/api/v1/oauth/code', data);
    return result
  },
  bind: async <T>(data: { bind_token: string, type: string, account: string, value: string }) => {
    const result = await shttp.post<T>('/api/v1/oauth/bind?bind_token=' + data.bind_token, data).then();
    return result
  }
}

export default user;