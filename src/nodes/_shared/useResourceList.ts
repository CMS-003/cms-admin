import { useCallback, useEffect, useRef, useState } from 'react';
import apis from '@/api';
import store from '@/store';
import { applyMapping } from '@/utils/mapping';
import type { FlatNode, IWidget } from '@/types';

/**
 * 列表类节点（Card / Banner …）的取数。
 *
 * 来源由 `widget.from` 决定，三种来源都归一成 `CardItem[]`，
 * 组件只负责摆位置 —— 不用各自去兜「这条数据叫 poster 还是 thumbnail」。
 *
 * | from     | 数据来自                                                          |
 * |----------|-------------------------------------------------------------------|
 * | `data`   | 节点自己的 `resources`（「数据」面板维护的静态数据，默认值）        |
 * | `global` | 全局配置里 `widget.source` 指向的那一段（`store.global.getValue`）  |
 * | `api`    | 请求 `widget.method` + 节点 `url`，响应按 `widget.mapping` 翻译      |
 *
 * 只有 `api` 要等网络：`loading` 就是骨架图的开关，`reload` 给「刷新」用。
 */

export type ResourceSource = 'data' | 'global' | 'api';

/** 一条卡片数据（三种来源归一之后的样子） */
export type CardItem = {
  /** 稳定 key：优先业务 id，退到 value / 下标 */
  key: string;
  title: string;
  /** 已拼好前缀的图片地址（绝对地址原样保留） */
  image: string;
  /** 原始那一项 —— 组件要用别的字段时从这里取 */
  raw: any;
};

export type ResourceList = {
  from: ResourceSource;
  items: CardItem[];
  /** 数据还在路上（只有 api 来源会为真） */
  loading: boolean;
  /** 真的会发网络请求：from 是 api 且配了地址 */
  remote: boolean;
  reload: () => void;
};

/**
 * 图片字段名各来源不一致，按优先级挑一个。
 * 相对路径补 CDN 前缀；`http(s)://` / `//` / `data:` 是外部地址，原样保留 ——
 * api 来源（第三方接口）基本都是绝对地址，加了前缀反而打不开。
 */
function toImageUrl(path: string): string {
  if (!path) return '';
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return store.app.imageLine + path;
}

function normalize(raw: any, index: number): CardItem {
  const it = raw || {};
  return {
    key: String(it._id ?? it.value ?? it.id ?? index),
    title: String(it.title ?? it.label ?? it.name ?? ''),
    image: toImageUrl(String(it.poster || it.thumbnail || it.cover || it.image || it.url || '')),
    raw: it,
  };
}

/**
 * 从响应里取列表。
 *
 * 配了 `mapping` 就按 mapping 折出来的形状取；没配就把常见的几种包装都试一遍
 * （本项目是 `{code,data:{items}}`，第三方常见 `{data:{list}}` / 裸数组）。
 */
function pickList(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  const data = (body as any).data;
  if (Array.isArray(data)) return data;
  for (const bucket of [data, body]) {
    if (!bucket || typeof bucket !== 'object') continue;
    for (const key of ['items', 'list', 'rows', 'records']) {
      if (Array.isArray(bucket[key])) return bucket[key];
    }
  }
  return [];
}

export function useResourceList(self: FlatNode): ResourceList {
  const widget = (self.widget || {}) as IWidget;
  const from: ResourceSource = (widget.from as ResourceSource) || 'data';
  const url = self.url || '';
  const mapping = widget.mapping;
  // 没配地址就当没有接口：直接给空列表，别让骨架图一直转
  const remote = from === 'api' && !!url;

  const [rows, setRows] = useState<any[]>([]);
  // 初值取 remote：首帧就是骨架图，不会先闪一下空状态
  const [loading, setLoading] = useState(remote);
  /** 请求序号：连点刷新 / 地址改得快时，只认最后一次的结果 */
  const seqRef = useRef(0);

  const reload = useCallback(async () => {
    if (!remote) return;
    const seq = ++seqRef.current;
    setLoading(true);
    try {
      const resp: any = await apis.fetch(widget.method, self.getApi({}, {}));
      if (seq !== seqRef.current) return;
      setRows(resp && resp.code === 0 ? pickList(applyMapping(resp, mapping)) : []);
    } catch (err) {
      if (seq === seqRef.current) setRows([]);
      console.log(err);
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [remote, widget.method, url, mapping]);

  // 地址 / 方法 / 映射变了要重拉（编辑器里改完立刻能看到效果）
  useEffect(() => {
    reload();
  }, [reload]);

  let source: any[] = [];
  if (from === 'global') {
    const global = store.global.getValue(widget.source) as any[] | null;
    source = Array.isArray(global) ? global : [];
  } else if (from === 'api') {
    source = rows;
  } else {
    source = (self.resources as any[]) || [];
  }

  // 故意不 memo：节点组件是 observer，这里读 self.resources / store.global
  // 才会被追踪到；每次渲染重建一个小数组的代价可以忽略
  return { from, items: source.map(normalize), loading, remote, reload };
}
