import axios, { AxiosRequestConfig, AxiosRequestHeaders, } from 'axios';
import { message } from 'antd'
import store from '../store'

//基础URL，axios将会自动拼接在url前
//process.env.NODE_ENV 判断是否为开发环境 根据不同环境使用不同的baseURL 方便调试
let baseURL = process.env.NODE_ENV === 'development' ? 'http://localhost:3334' : 'https://your.domain.com/api';

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
    let customHeaders: AxiosRequestHeaders = {
      'Accept-Language': 'zh-CN',
      'Authorization': '',
      'X-Token': store.user.getAccessToken()
    };
    config.headers = customHeaders;
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
  data?: T
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
const requestHandler = <T>(method: 'get' | 'post' | 'put' | 'delete' | 'patch', url: string, params: object = {}, config: AxiosRequestConfig = {}): Promise<BaseResultWrapper<T> & BaseResultsWrapper<T>> => {
  let response: Promise<BaseResponse>;
  switch (method) {
    case 'get':
      response = instance.get(url, { params: { ...params }, ...config });
      break;
    case 'post':
      response = instance.post(url, { ...params }, { ...config });
      break;
    case 'put':
      response = instance.put(url, { ...params }, { ...config });
      break;
    case 'delete':
      response = instance.delete(url, { params: { ...params }, ...config });
      break;
    case 'patch':
      response = instance.patch(url, { params: { ...params }, ...config });
      break;
  }

  return new Promise<any>((resolve, reject) => {
    response.then(res => {
      //业务代码 可根据需求自行处理
      const body = res.data;
      if (res.status !== 200) {

        //特定状态码 处理特定的需求
        if (res.status === 401) {
          message.warn('您的账号已登出或超时，即将登出...');
          console.log('登录异常，执行登出...');
        }

        let e = JSON.stringify(body);
        message.warn(`请求错误：${e}`);
        console.log(`请求错误：${e}`)
        //数据请求错误 使用reject将错误返回
        reject(body);
      } else {
        //数据请求正确 使用resolve将结果返回
        resolve(body);
      }
    }).catch(error => {
      let e = JSON.stringify(error);
      message.warn(`网络错误：${e}`);
      console.log(`网络错误：${e}`)
      reject(error);
    })
  })
}

interface Request<T> {
  constructor(): Promise<this>;
  url: string;
  method: string;
  data?: any;
  params?: any;
  headers?: any;
  then(fn: Function): PromiseLike<BaseResultWrapper<T> & BaseResultsWrapper<T>>;
}
class Request<T> {
  constructor(url: string, method: string) {
    this.url = url;
    this.method = method;
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

  async then(cb: (param: Promise<T>) => void): Promise<BaseResultWrapper<T> & BaseResultsWrapper<T>> {
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
    const response = instance.request(option)
    const result = await new Promise<any>((resolve, reject) => {
      response.then(res => {
        //业务代码 可根据需求自行处理
        const body = res.data;
        if (res.status !== 200) {

          //特定状态码 处理特定的需求
          if (res.status === 401) {
            message.warn('您的账号已登出或超时，即将登出...');
            console.log('登录异常，执行登出...');
          }

          let e = JSON.stringify(body);
          message.warn(`请求错误：${e}`);
          console.log(`请求错误：${e}`)
          //数据请求错误 使用reject将错误返回
          reject(body);
        } else {
          //数据请求正确 使用resolve将结果返回
          resolve(body);
        }
      }).catch(error => {
        let e = JSON.stringify(error);
        message.warn(`网络错误：${e}`);
        console.log(`网络错误：${e}`)
        reject(error);
      })
    })
    if (cb) {
      cb(result)
    }
    return result
  }
}

// 使用 request 统一调用，包括封装的get、post、put、delete等方法
const shttp = {
  get<T>(url: string) {
    return new Request<T>(url, 'GET')
  },
  post: <T>(url: string, params?: object, config?: AxiosRequestConfig) => requestHandler<T>('post', url, params, config),
  put: <T>(url: string, params?: object, config?: AxiosRequestConfig) => requestHandler<T>('put', url, params, config),
  delete<T>(url: string) {
    return new Request<T>(url, 'DELETE')
  },
  patch: <T>(url: string, params?: object, config?: AxiosRequestConfig) => requestHandler<T>('delete', url, params, config),
};

export default shttp;