import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd'
import store from '../store'
import { set, isArray } from 'lodash';

//基础URL，axios将会自动拼接在url前
//process.env.NODE_ENV 判断是否为开发环境 根据不同环境使用不同的baseURL 方便调试
let baseURL = store.app.baseURL;

//默认请求超时时间
const timeout = 10000;

//创建axios实例
const instance = axios.create({
  timeout,
  baseURL,
  //如需要携带cookie 该值需设为true
  withCredentials: false
});

//统一请求拦截 可配置自定义headers 例如 language、token等
instance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    //配置自定义请求头
    const headers: any = config.headers;
    headers.common['Accept-Language'] = 'zh-CN';
    headers.common['X-project-id'] = store.app.project_id;
    headers.common['Authorization'] = 'Bearer ' + store.user.getAccessToken();
    return config
  },
  error => {
    console.log(error)
    Promise.reject(error)
  }
)

//axios返回格式
export interface BaseResponse {
  data: any;
  status: number;
  statusText: string;
}

// 后台响应数据格式
export interface BaseResultWrapper<T> {
  code: number,
  message: string,
  data?: T,
}

export interface BaseResultsWrapper<T> {
  code: number,
  message: string,
  data: {
    total?: number,
    items: T[],
    ended?: boolean,
  }
}

//核心处理代码 将返回一个promise 调用then将可获取响应的业务数据
const requestHandler = <T>(method: 'get' | 'post' | 'put' | 'delete' | 'patch', url: string, params: object = {}, config: AxiosRequestConfig = {}) => {
  let response: Promise<BaseResponse>;
  switch (method) {
    case 'get':
      response = instance.get(url, { params, ...config, headers: {} });
      break;
    case 'post':
      response = instance.post(url, params, { ...config, headers: {} });
      break;
    case 'put':
      response = instance.put(url, params, { ...config, headers: {} });
      break;
    case 'delete':
      response = instance.delete(url, { params, ...config, headers: {} });
      break;
    case 'patch':
      response = instance.patch(url, { params, ...config, headers: {} });
      break;
  }

  return new Promise<BaseResultWrapper<T>>((resolve, reject) => {
    response.then(res => {
      //业务代码 可根据需求自行处理
      const body = res.data;
      if (res.status === 200) {
        if (body.code === 101010) {
          store.user.setAccessToken('')
          window.location.href = '/manager/sign-in'
        }
        //数据请求正确 使用resolve将结果返回
        resolve(body as (BaseResultWrapper<T> & BaseResultsWrapper<T>));

      } else if (res.status === 401) {
        //特定状态码 处理特定的需求
        message.warn('您的账号已登出或超时，即将登出...');
        console.log('登录异常，执行登出...');
      } else {
        let e = JSON.stringify(body);
        message.warn(`请求错误：${e}`);
        console.log(`请求错误：${e}`)
        //数据请求错误 使用reject将错误返回
        resolve(body);
      }
    }).catch(error => {
      let e = JSON.stringify(error);
      message.warn(`网络错误：${e}`);
      console.log(`网络错误：${e}`)
      resolve({ code: -1, message: error.message })
    })
  })
}

interface Request<T> {
  constructor(): this;
  url: string;
  method: string;
  data?: any;
  params?: any;
  headers?: any;
  then(fn?: Function): PromiseLike<(BaseResultWrapper<T> & BaseResultsWrapper<T>)>;
}
class Request<T> {
  constructor(method: string, url: string) {
    this.url = url;
    this.method = method;
    return this;
  }

  async getSelf() {
    return this;
  }

  async send(data: any) {
    this.data = data
    return this
  }
  async query(query: any) {
    this.params = query
    return this
  }
  async header(headers: any) {
    this.headers = headers
    return this
  }

  async then(cb?: (param: Promise<T>) => void) {
    const option: AxiosRequestConfig = {
      url: this.url,
      method: this.method,
    }
    if (this.data) {
      option.data = this.data
    }
    if (this.params) {
      option.params = this.params
    }
    if (this.headers) {
      option.headers = this.headers
    }
    set(option, 'headers.Authorization', `Bearer ${store.user.getAccessToken()}`)
    const response = instance.request(option)
    const result = await new Promise<any>((resolve, reject) => {
      response.then(async (res) => {
        //业务代码 可根据需求自行处理
        const body = res.data;
        if (res.status !== 200) {
          //数据请求错误 使用reject将错误返回
          resolve(body);
        } else if (res.data.code === 101010 && window.location.pathname !== '/manager/sign-in' && !option.url?.startsWith('/api/v1/users/refresh')) {
          // 自动刷新逻辑
          shttp.post<{ access_token: string, refresh_token: string }>('/api/v1/users/refresh', { refresh_token: store.user.getRefreshToken() })
            .then(rResp => {
              if (rResp.code !== 0 || !rResp?.data?.access_token || !rResp.data.refresh_token) {
                throw new Error('refresh fail')
              } else {
                store.user.setAccessToken(rResp.data.access_token)
                store.user.setRefreshToken(rResp.data.refresh_token)
                set(option, 'headers.Authorization', `Bearer ${store.user.getAccessToken()}`)
                instance.request(option).then(resp2 => {
                  if (resp2.status === 200 && resp2.data.code === 0) {
                    cb && cb(resp2.data)
                    resolve(resp2.data as BaseResultWrapper<T>)
                  } else {
                    throw new Error('retry fail')
                  }
                })
              }
            })
            .catch(e => {
              message.warn('您的账号已登出或超时，即将登出...');
              console.log('登录异常，执行登出...');
              window.location.href = '/manager/sign-in'
              resolve(body);
            });
        } else {
          if (cb) {
            cb(body)
          }
          // if (body.data && isArray(body.data.list)) {
          //   body.data.items = body.data.list
          // } else if (isArray(body.data)) {
          //   body.data = {
          //     items: body.data,
          //     total: 0,
          //   }
          // }
          //数据请求正确 使用resolve将结果返回
          resolve(body as (BaseResultWrapper<T> & BaseResultsWrapper<T>));
        }
      }).catch(error => {
        message.warn(`网络错误：${error.message}`);
        resolve({ code: -1, message: error.message });
      })
    });
    return result;
  }
}

// 使用 request 统一调用，包括封装的get、post、put、delete等方法
const shttp = {
  get<T>(url: string) {
    return new Request<(BaseResultWrapper<T> & BaseResultsWrapper<T>)>('get', url)
  },
  post: <T>(url: string, params?: object, config?: AxiosRequestConfig) => requestHandler<T>('post', url, params, config),
  put: <T>(url: string, params?: object, config?: AxiosRequestConfig) => requestHandler<T>('put', url, params, config),
  delete<T>(url: string) {
    return new Request<(BaseResultWrapper<T> & BaseResultsWrapper<T>)>('delete', url)
  },
  patch: <T>(url: string, params?: object, config?: AxiosRequestConfig) => requestHandler<T>('patch', url, params, config),
};

export default shttp;