import * as _ from 'lodash'
import crypto from 'crypto-js'

/**
 * 字符串转base64编码
 */
 export function encodeBase64(text: string): string {
  return window.btoa(text || '')
}

/**
 * base64编码转字符串
 */
export function decodeBase64(base64string: string): string {
  return window.atob(base64string || '')
}

/**
 * 获取接口签名
 */
 export function getSignature(path: string, params: { nonce: string, timestamp: number }, obj: { [key: string]: any }) {
  let text = ''
  Object.keys(obj).sort().forEach(key => {
    const v = _.isPlainObject(obj[key]) ? JSON.stringify(obj[key]) : obj[key]
    text += `${key}=${encodeURIComponent(v)}&`
  })
  text += `path=${path}&nonce=${params.nonce}&timestamp=${params.timestamp}`
  const hmac = crypto.HmacSHA256(text, 'KLvA)6r-?^rn');
  const sign = hmac.toString();
  const signature = encodeBase64(JSON.stringify(Object.assign({ sign }, params)))
  return signature
}