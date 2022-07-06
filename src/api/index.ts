import shttp from "../utils/shttp";
import constant from '../constant'
import store from '../store'
import { Component } from '../types'

export const SignIn = async (data: { account: string, pass: string }) => {
  const result: any = await shttp.post("/api/v1/oauth/sign-in", data)
  store.user.setAccessToken(result[constant.ACCESS_TOKEN])
  store.user.setRefreshToken(result[constant.REFRESH_TOKEN])
  store.app.setIsSignIn(true)
  return result;
};

export const getMenu = async () => {
  const result: any = await shttp.get('/api/v1/menus');
  return result
}

export const getComponents = async () => {
  const result: any = await shttp.get('/api/v1/components');
  return result
}

export const createComponent = async ({ body }: { body: Component }) => {
  const result: any = await shttp.post('/api/v1/components', body);
  return result
}

export const destroyComponent = async ({ params }: { params: any }) => {
  const result: any = await shttp.delete(`/api/v1/components/${params.id}`)
  return result
}