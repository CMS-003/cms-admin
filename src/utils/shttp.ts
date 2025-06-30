import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd'
import store from '../store'
import { set, isArray } from 'lodash';

let isRefreshing = false;
let requestQueue: any = [];

//创建axios实例
const instance = axios.create({
  baseURL: store.app.baseURL,
  withCredentials: false,
  timeout: 2000,
});

//统一请求拦截 可配置自定义headers 例如 language、token等
instance.interceptors.request.use(
  (config: AxiosRequestConfig & { _retry?: boolean }) => {
    //配置自定义请求头
    const headers: any = config.headers;
    headers['Accept-Language'] = 'zh-CN';
    headers['X-project-id'] = store.app.project_id;
    headers['Authorization'] = 'Bearer ' + store.user.getAccessToken();
    return config
  },
  error => {
    console.log(error)
    Promise.reject(error)
  }
);

instance.interceptors.response.use(
  async (response) => {
    const config: AxiosRequestConfig & { _retry?: boolean } = response.config;
    // 判断业务码：code === 101010 表示 token 过期
    if (response.config.url !== '/gw/user/oauth/refresh' && (response.data.code === 101010 || response.data.code === 101020) && !config._retry) {
      config._retry = true;
      if (isRefreshing) {
        // 正在刷新 token，将请求加入队列
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject });
        }).then(() => {
          return instance(config);
        });
      }
      isRefreshing = true;
      try {
        const resp = await axios.post(`${store.app.baseURL}/gw/user/oauth/refresh`, null, {
          headers: { Authorization: store.user.getRefreshToken(), }
        });
        if (resp && resp.data && resp.data.code === 0) {
          const tokens = resp.data.data;
          store.user.setAccessToken(tokens.access_token);
          store.user.setRefreshToken(tokens.refresh_token);
        }
        // 执行队列中的请求
        requestQueue.forEach((p: any) => p.resolve());
        requestQueue = [];
        return instance(config);
      } catch (err) {
        requestQueue.forEach((p: any) => p.reject(err));
        requestQueue = [];
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return response;
  },
  (error) => {
    console.log(error, 'response error');
    if (error.response) {
      if (error.response.data.code === 101020) {
        store.user.setAccessToken('');
      }
    } else {
    }
    return Promise.reject(error);
  },
);

//axios返回格式
export interface BaseResponse {
  data: any;
  status: number;
  statusText: string;
}

// 后台响应数据格式
export interface BaseWrapper<T> {
  code: number,
  message: string,
  data: T,
}

export interface BaseResultWrapper<T> {
  code: number,
  message: string,
  data: {
    item: T
  },
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
type Method = 'get' | 'post' | 'put' | 'delete' | 'patch'
class Request<T> implements PromiseLike<BaseResultWrapper<T>> {
  private method: Method;
  private url: string;
  private params: Record<string, any> = {};
  private data: any = undefined;
  private headers: Record<string, any> = {};

  constructor(method: Method, url: string) {
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

  fetch() {
    const u = new URL(store.app.baseURL);
    let url = this.url;
    if (url.startsWith('/gw')) {
      url = u.origin + url;
    } else {
      url = store.app.baseURL + url
    }
    const option: AxiosRequestConfig = {
      url,
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
    return new Promise<any>((resolve, reject) => {
      response.then(async (res) => {
        //业务代码 可根据需求自行处理
        const body = res.data;
        if (res.status !== 200) {
          //数据请求错误 使用reject将错误返回
          resolve(body);
        } else {
          //数据请求正确 使用resolve将结果返回
          resolve(body as (BaseResultWrapper<T> & BaseResultsWrapper<T>));
        }
      }).catch(error => {
        message.warn(`网络错误：${error.message}`);
        resolve({ code: -1, message: error.message });
      })
    });
  }

  then<TResult1 = BaseResultWrapper<T>, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>),
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>)
  ): Promise<TResult1 | TResult2> {
    return this.fetch().then(onfulfilled, onrejected);
  }
}

// 使用 request 统一调用，包括封装的get、post、put、delete等方法
const shttp = {
  get<T>(url: string) {
    // @ts-ignore
    return new Request<T>('get', url)
  },
  delete<T>(url: string) {
    // @ts-ignore
    return new Request<T>('delete', url)
  },
  post<T>(url: string, params?: object) {
    // @ts-ignore
    return new Request<T>('post', url).send(params)
  },
  put<T>(url: string, params?: object) {
    // @ts-ignore
    return new Request<T>('post', url).send(params)
  },
  patch<T>(url: string, params?: object) {
    // @ts-ignore
    return new Request<T>('post', url).send(params)
  },
};

export default shttp;