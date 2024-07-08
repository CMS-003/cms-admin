import constant from '../constant'

export function getKey(key: string) {
  let v = localStorage.getItem(constant.storage_prefix + key);
  if (v) {
    const data: { type: string, value: any } = JSON.parse(v);
    return data.value;
  }
  return v;
}

export function setKey(key: string, data: any) {
  localStorage.setItem(constant.storage_prefix + key, JSON.stringify({ type: typeof data, value: data }))
}

const storage = {
  getKey, setKey
}
export default storage;
