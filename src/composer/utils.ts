import { FlatNode, IComponent, ITemplate, IWidget } from "@/types";

export function getDiff(t: ITemplate | IComponent | null) {
  if (!t) {
    return [];
  }
  const results: any[] = [];
  if (t.children) {
    t.children.forEach((child: IComponent) => {
      const diff = child.diff()
      if (diff) {
        results.push(child.toJSON())
      }
      const subResults = getDiff(child);
      if (subResults.length) {
        results.push(...subResults)
      }
    })
  }
  return results;
}

export function getWidgetValue(widget: IWidget, value: any) {
  switch (widget.type) {
    case 'boolean':
      value = [1, '1', 'true', 'TRUE', true].includes(value) ? true : false;
      break;
    case 'number':
      value = value === '' ? "" : parseFloat(value) || 0
      break;
    case 'array':
      try {
        value = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        return;
      }
      break;
    case 'json':
      try {
        value = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        return;
      }
      break;
    default: break;
  }
  return value;
}

export function mergeQuery(rawUrl: string, additionalQuery: { [key: string]: any }) {
  // 判断是否为完整 URL（包含协议）
  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(rawUrl);

  // 构造 URL 对象：相对路径需要提供一个 base（location.href 可用）
  const base = window.location.origin;
  const url = hasProtocol ? new URL(rawUrl) : new URL(rawUrl, base);

  // 合并 query 参数
  const params = new URLSearchParams(url.search);
  for (const [key, value] of Object.entries(additionalQuery)) {
    params.set(key, value); // 会覆盖已有 key
  }

  url.search = params.toString();

  // 返回
  return hasProtocol
    ? url.toString()                         // 完整 URL：返回完整的带 host 的 URL
    : url.pathname + url.search;            // 相对路径：去掉 host，只保留路径和 query
}
export function getApi(self: FlatNode, params: any = {}, query: any = {}) {
  let url = self.url;
  const regex = /:([a-zA-Z\-_]+)/g;
  const matches = [...url.matchAll(regex)];
  matches.forEach(match => {
    url = url.replace(match[0], params[match[1]])
  })
  url = mergeQuery(url, query)
  return url;
}