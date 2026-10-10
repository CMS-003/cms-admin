/**
 * URL 工具（模板节点拼接口地址用）。
 */

/** 把 additionalQuery 合并进 url 的 query（同名覆盖）。相对路径返回 pathname + search，绝对地址原样返回 */
export function mergeQuery(rawUrl: string, additionalQuery: { [key: string]: any }): string {
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

/**
 * 把 path 里的 query string 解析成对象（'?id=1&a=2' → { id: '1', a: '2' }）。
 *
 * 作用是把「地址栏」变成页面查询条件的来源：打开弹框时 path 传 '?id=xxx'，
 * 弹框里的模板（Form）就能通过 useQuery('id') 读到记录 id 去拉详情。
 */
export function parseQuery(path?: string): Record<string, string> {
  if (!path) return {};
  const qs = path.split('?')[1];
  if (!qs) return {};
  return Object.fromEntries(new URLSearchParams(qs)) as Record<string, string>;
}

/**
 * 节点的接口地址：先把 `:id` / `:字段` 这类占位符用 params 填掉，再合并 query。
 *
 * 例 `'/gw/api/v1/resources/:id'` + `{ id: 'abc' }` + `{ page: 1 }`
 * → `'/gw/api/v1/resources/abc?page=1'`
 */
export function fillUrl(rawUrl: string, params: any = {}, query: any = {}): string {
  let url = rawUrl || '';
  const regex = /:([a-zA-Z\-_]+)/g;
  const matches = [...url.matchAll(regex)];
  matches.forEach(match => {
    url = url.replace(match[0], params[match[1]]);
  });
  return mergeQuery(url, query);
}
