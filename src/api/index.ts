import shttp from "../utils/shttp";
import constant from '../constant'
import store from '../store'

export const SignIn = async (data: { account: string, pass: string }) => {
  const result: any = await shttp.post("/api/v1/oauth/sign-in", data)
  store.user.setAccessToken(result[constant.ACCESS_TOKEN])
  store.user.setRefreshToken(result[constant.REFRESH_TOKEN])
  store.app.setIsSignIn(true)
  return result;
};
