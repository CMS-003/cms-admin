import shttp, { BaseResultWrapper } from "../utils/shttp";
import { IUser, IVerification } from "../types";

const user = {
  SignIn: async (data: { type: string, account: string, value: string }) => {
    const result: any = await shttp.post("/gw/user/oauth/sign-in", data)
    return result;
  },
  SignOut: async (data: any) => {
    const result = await shttp.post('/gw/user/oauth/sign-out', data);
    return result;
  },
  refresh: async (data: { refresh_token: string }) => {
    const result = await shttp.post<{ refresh_token: string, access_token: string, type: string }>('/gw/user/refresh', data);
    return result;
  },
  getProfile: async <T>() => {
    return await shttp.get<BaseResultWrapper<IUser>>('/gw/user/profile')
  },
  getApps: async <T>() => {
    const result = await shttp.get<T>('/gw/api/v1/user/apps')
    return result
  },
  sendCode: async <T>(data: { method: number, type: string, account: string }) => {
    const result = await shttp.post<T>('/gw/user/send-code', data);
    return result
  },
  getCodes: async (query: { page: number, method: string, type: string }) => {
    const result = await shttp.get<IVerification>(`/gw/api/v1/logs/codes`).query(query);
    return result
  },
  bind: async <T>(data: { bind_token: string, type: string, account: string, value: string }) => {
    const result = await shttp.post<T>('/gw/user/bind?bind_token=' + data.bind_token, data).then();
    return result
  }
}

export default user;