import { get } from 'lodash-es';

/**
 * 响应映射（`widget.mapping`）的语义 —— 编辑器「事件」面板里配置，只有
 * `action === 'FETCH'` 用得上。
 *
 * 为什么要它：项目内部的接口统一回 `{ code, message, data }`，但 `url` 指向
 * 外部地址时，包装格式和字段名都不由我们定 —— 可能是 `{ status, result: { list } }`，
 * 列表也可能直接就是个数组（本项目 `data` 是数组，第三方可能在 `data.list`）。
 * 这份配置负责把「原始响应 body」翻译成项目统一的结构，翻译规则只有两条：
 *
 * ```
 * { code: 0, data: '$data.list', message: '$msg' }
 *   → { code: 0, data: body.data.list, message: body.msg }
 * ```
 *
 * - 值以 `$` 开头 → **取值路径**，lodash `get(body, path)` 去 body 上取
 * - 其他值 → **默认填充值**，原样写进结果（取不到就靠它兜底）
 * - `$$` 开头 → 转义，得到字面量 `$` 开头的字符串
 *
 * 没配 mapping 时直接返回原 body（等价于「不做任何过滤」）。
 */
export function applyMapping(body: any, mapping?: Record<string, any> | null): any {
  if (!mapping || typeof mapping !== 'object') return body;
  const keys = Object.keys(mapping);
  if (!keys.length) return body;
  const out: Record<string, any> = {};
  for (const key of keys) {
    out[key] = resolveRule(body, mapping[key]);
  }
  return out;
}

/** 单条规则 → 结果值：`$路径` 取值，其余当默认填充值 */
function resolveRule(body: any, rule: any): any {
  if (typeof rule !== 'string') return rule;
  if (rule.charAt(0) !== '$') return rule;
  // '$$foo' → 字面量 '$foo'（路径本身以 $ 开头时唯一的表达方式）
  if (rule.charAt(1) === '$') return rule.slice(1);
  return get(body, rule.slice(1));
}

// ---------------------------------------------------------------------------
// 编辑面板 ↔ 存储值
// ---------------------------------------------------------------------------

/** 编辑面板里的一行（值在输入框里永远是文本，写回时才归一成真实类型） */
export type MappingRow = { key: string; value: string };

/**
 * `widget.mapping` → 可编辑的行。
 *
 * 面板用「一行一个字段」而不是直接摊对象：
 * 1. 新增行时字段名还是空的 —— 以对象为准的话，两行空字段名会被对象吃掉一行
 * 2. 输入框以行下标为 key，改字段名不会让行「换身份」导致光标跳走
 */
export function toMappingRows(mapping?: Record<string, any> | null): MappingRow[] {
  return Object.entries(mapping || {}).map(([key, rule]) => ({ key, value: formatRule(rule) }));
}

/** 行 → `widget.mapping`（跳过空字段名，值交给 `parseRule` 归一） */
export function foldMappingRows(rows: MappingRow[]): Record<string, any> {
  const out: Record<string, any> = {};
  rows.forEach(row => {
    const key = row.key.trim();
    if (key) out[key] = parseRule(row.value);
  });
  return out;
}

/**
 * 编辑面板输入框文本 → 存储值。
 *
 * 面板里值就是一串文本，这里把它归一成真实类型：
 * - `$` 开头 → 保持字符串（是路径，不是值）
 * - 能被 JSON 解析 → 用解析结果（`'0'` → `0`、`'true'` → `true`、`'null'` → `null`）
 * - 其他 → 原样当字符串（`'abc'` → `'abc'`）
 *
 * 想让字面量保持字符串形态、又恰好是合法 JSON 的（例如字符串 "0"），写成 `"0"` 带引号即可。
 */
export function parseRule(text: string): any {
  const t = text ?? '';
  if (t.charAt(0) === '$') return t;
  const trimmed = t.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return t;
  }
}

/**
 * 存储值 → 面板输入框文本（`parseRule` 的逆运算，保证往返一致）。
 *
 * 字符串能原样往返就原样（`'$data.list'` / `'abc'`），
 * 否则加引号（字符串 `'0'` 得写成 `"0"`，不然会被 `parseRule` 解析成数字 0）。
 */
export function formatRule(rule: any): string {
  if (rule === null || rule === undefined) return '';
  if (typeof rule === 'string') {
    return parseRule(rule) === rule ? rule : JSON.stringify(rule);
  }
  try {
    return JSON.stringify(rule);
  } catch {
    return String(rule);
  }
}
