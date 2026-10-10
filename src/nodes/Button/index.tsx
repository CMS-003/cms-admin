import { IBaseCom } from "@/types";
import { Acon } from "@/components";
import { GripVertical } from "lucide-react";
import { Button, message, notification, Popconfirm, Popover, Upload } from 'antd';
import { CopyToClipboard } from 'react-copy-to-clipboard-ts';
import { useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useLocalProxy } from "@/utils/valtio";
import { ModalView } from "@/composer/ModalView";
import events from "@/utils/event";
import CONST from "@/constant";
import apis from "@/api";
import store from "@/store";
import { get, isEmpty, pick } from 'lodash-es';
import hbs from 'handlebars';
import type { RcFile } from "antd/es/upload";
import { useActions, useMode, usePage, useSource } from "@/context";

/**
 * 按钮节点 = 一个按钮 + 一种事件。事件由 `widget.action` 决定（编辑器「事件」面板）：
 *
 * | action    | 行为                                                                      |
 * |-----------|---------------------------------------------------------------------------|
 * | ''        | 纯展示，不接任何交互                                                       |
 * | FETCH     | 发请求（refer 筛字段），成功后广播 SEARCH 让同级列表刷新；attrs.confirm 走二次确认 |
 * | SEARCH    | 回到第 1 页并广播 SEARCH（列表页的「搜索」按钮）                            |
 * | COPY      | 复制 widget.field 对应的值（取不到才退回 widget.value）                     |
 * | UPLOAD    | 选中文件 → FormData 发给 url → 把返回的 filepath 写回字段                   |
 * | OPEN_URL  | 外链，url 先当 handlebars 模板用当前数据渲染                                |
 * | GOTO_PAGE | 跳标签页（带上当前记录的 id）                                               |
 * | MODAL     | 打开弹框，内嵌 widget.method 指定的模板（靠 path 把记录 id 传进去）         |
 * | PREVIEW   | Popover 预览图片 / 视频                                                     |
 *
 * 与 `nodes/Icon` 完全同构，只是外观换成 antd Button。
 * 数据侧一律走当前子树的 DataEnv：读 source、写用 actions.setDataField ——
 * 所以这个按钮放在 Table 的单元格里读写的就是**那一行**，放在 Form 里就是详情本身。
 */
export default function CButton({ self, bindings, children }: IBaseCom) {
  const source = useSource();
  const actions = useActions();
  const mode = useMode();
  const page = usePage();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const navigate = useNavigate();

  const data = source || {};
  const widget = self.widget || {};
  const action = widget.action || '';
  const field = widget.field || '';

  const [localState, localStore] = useLocalProxy({
    /** MODAL：当前打开的模板 id，'' 表示没开 */
    template_id: '',
    /** MODAL：要打开的记录 id（拼进 path 的 query，供弹框里的 Form 读取） */
    id: '',
    /** UPLOAD：上传中 */
    loading: false,
  });

  /**
   * OPEN_URL：url 是 handlebars 模板，用当前数据渲染出真实地址。
   * 旧版只在挂载时编译一次，Table 这种每行数据不同的场景会拿到上一行的 url，
   * 这里跟着数据重算。
   */
  const openUrl = useMemo(() => {
    if (action !== CONST.ACTION_TYPE.OPEN_URL) return '';
    try {
      return hbs.compile(self.url || '')(data);
    } catch (e) {
      console.log(e);
      return self.url || '';
    }
  }, [action, self.url, data]);

  /** 图片 / 视频的相对路径（PREVIEW 用） */
  const mediaPath = action === CONST.ACTION_TYPE.PREVIEW ? get(data, field) : '';

  /** COPY：字段值优先，取不到才退回配置的默认值（0 / false 是有效值，不能当空） */
  const copyText = String(get(data, field) ?? widget.value ?? '');

  /** FETCH：把当前数据（或 refer 指定的字段）发到 url */
  const request = useCallback(async () => {
    try {
      const refer: any[] = widget.refer || [];
      const payload = isEmpty(refer)
        ? data
        : pick(data, refer.map((r: any) => r.value as string));
      // url 里的 :id / :字段 占位符由这里提供；没有 id 时不能让 :id 被替换成 "undefined"
      const params: Record<string, any> = {};
      if (data && data._id) params.id = data._id;
      if (field) params[field] = get(data, field);
      const result = await apis.fetch(widget.method, self.getApi(params), payload);
      if (result.code === 0) {
        // 广播给同级列表（Table 监听它重新拉数据）
        events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) });
        notification.info({ title: '请求成功', placement: 'topRight' });
      } else {
        message.warning(result.message);
      }
    } catch (e) {
      console.log(e);
      message.error('操作异常');
    }
  }, [widget, data, field, self, page]);

  /** SEARCH：回到第 1 页再广播 */
  const runSearch = useCallback(() => {
    actions.setQuery('page', 1);
    events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) });
  }, [actions, page]);

  /** UPLOAD：FormData 提交，把返回的 filepath 写回字段 */
  const doUpload = useCallback(async (file: RcFile) => {
    if (!self.url) {
      message.warning('未配置上传地址');
      return;
    }
    localStore.loading = true;
    const current = get(data, field);
    try {
      const form = new FormData();
      form.append(self.name || 'file', file);
      // 服务端要知道「替换哪张图」，就是字段当前的值
      if (current) form.append('filepath', current);
      const result = await apis.fetch(widget.method, self.url, form);
      if (result.code === 0) {
        const next = (result.data as any)?.filepath;
        if (next) {
          // 写回当前子树的数据源：Table 里就是那一行，Form 里就是详情
          actions.setDataField(widget, next);
        }
        message.success('上传成功', 1);
      } else {
        message.warning(result.message);
      }
    } catch (e) {
      console.log(e);
      message.error('上传失败');
    } finally {
      localStore.loading = false;
    }
  }, [widget, data, field, self.name, self.url, actions, localStore]);

  /** MODAL：记录 id 通过 path 的 query 传给内嵌模板 */
  const openModal = useCallback(() => {
    if (!widget.method) {
      message.warning('未配置弹框模板');
      return;
    }
    localStore.id = (data && data._id) || '';
    localStore.template_id = widget.method;
  }, [data, widget, localStore]);

  const closeModal = useCallback(() => {
    localStore.template_id = '';
  }, [localStore]);

  // 按钮本体：所有分支共用一个，只是各自包一层交互
  const button = <Button
    type={self.attrs.type || 'primary'}
    icon={self.icon ? <Acon icon={self.icon as any} /> : undefined}
  >{self.title}</Button>;

  let content: any = button;

  if (action === CONST.ACTION_TYPE.COPY) {
    content = (
      <CopyToClipboard text={copyText} onCopy={() => { message.success('复制成功', 1) }}>
        {button}
      </CopyToClipboard>
    );

  } else if (action === CONST.ACTION_TYPE.FETCH) {
    content = self.attrs?.confirm
      ? <Popconfirm title='确认是否删除' okText='是' cancelText='否' onConfirm={request}>
        <span style={{ display: 'inline-flex' }}>{button}</span>
      </Popconfirm>
      : <Button
        type={self.attrs.type || 'primary'}
        icon={self.icon ? <Acon icon={self.icon as any} /> : undefined}
        onClick={request}
      >{self.title}</Button>;

  } else if (action === CONST.ACTION_TYPE.SEARCH) {
    content = <Button
      type={self.attrs.type || 'primary'}
      icon={self.icon ? <Acon icon={self.icon as any} /> : undefined}
      onClick={runSearch}
    >{self.title}</Button>;

  } else if (action === CONST.ACTION_TYPE.UPLOAD) {
    content = (
      <Upload
        showUploadList={false}
        name={self.name || 'file'}
        action={self.url}
        method={String(widget.method || 'post').toLowerCase() as 'post' | 'put'}
        multiple={false}
        disabled={localState.loading}
        // 上传自己用 apis.fetch 发（要带 filepath 之类额外字段），
        // 返回 false 让 antd 不要自己再发一次
        beforeUpload={(file) => { doUpload(file as unknown as RcFile); return false; }}
      >
        <Button
          type={self.attrs.type || 'primary'}
          icon={<Acon icon={(self.icon || 'Upload') as any} />}
          loading={localState.loading}
        >{self.title}</Button>
      </Upload>
    );

  } else if (action === CONST.ACTION_TYPE.OPEN_URL) {
    // 不能写成 <Link><Button/></Link>（a 里嵌 button 语义不对），
    // 用 onClick 开新页更稳。
    content = <Button
      type={self.attrs.type || 'primary'}
      icon={self.icon ? <Acon icon={self.icon as any} /> : undefined}
      onClick={() => { window.open(openUrl, '_blank'); }}
    >{self.title}</Button>;

  } else if (action === CONST.ACTION_TYPE.GOTO_PAGE) {
    content = <Button
      type={self.attrs.type || 'primary'}
      icon={self.icon ? <Acon icon={self.icon as any} /> : undefined}
      onClick={() => { navigate(`${self.url}?id=${(data && data._id) || ''}`) }}
    >{self.title}</Button>;

  } else if (action === CONST.ACTION_TYPE.MODAL) {
    content = <Button
      type={self.attrs.type || 'primary'}
      icon={self.icon ? <Acon icon={self.icon as any} /> : undefined}
      onClick={openModal}
    >{self.title}</Button>;

  } else if (action === CONST.ACTION_TYPE.PREVIEW) {
    content = (
      <Popover trigger='click' content={
        widget.method === 'video'
          ? <video controls src={store.app.videoLine + (mediaPath || '')} style={{ height: 300 }} />
          : <img src={store.app.imageLine + (mediaPath || '')} style={{ height: 100 }} alt='' />
      }>
        <span style={{ display: 'inline-flex' }}>
          <Button
            type={self.attrs.type || 'primary'}
            icon={<Acon icon={(self.icon || 'FileSearch') as any} />}
          >{self.title}</Button>
        </span>
      </Popover>
    );
  }

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    {children}
    {content}
    {/*
      弹框：内嵌一个独立的 TemplateView（mode='preview'，自带 store 与 page）。
      path='?id=xxx' 会把记录 id 落进那个 TemplateView 的 query，
      里面的 Form 用 useQuery('id') 就能拉到这条记录 —— 这是调试表单的主路径。
    */}
    {localState.template_id && (
      <ModalView
        template_id={localState.template_id}
        path={`?id=${localState.id}`}
        title={self.title || '弹框'}
        width={localState.id ? 720 : 520}
        onClose={closeModal}
      />
    )}
  </div>
}
