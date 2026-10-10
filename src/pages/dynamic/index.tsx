import { TemplateView } from '@/composer/TemplateView'

/**
 * 动态页：用 TemplateView（nodes 版组件）渲染一个模板。
 *
 * 不需要包 Observer —— TemplateView 自己是 `React.memo(observer(...))`，
 * 外层再套一层只会让 props 变化时多绕一圈；原来那个 useMemo 的 deps 还漏了 id。
 *
 * `.node` 等节点样式由 `composer/TemplateView.tsx` 里的 `import './styles.css'`
 * 统一带上（TemplateView 是所有渲染路径的公共入口）。之前样式只挂在编辑器入口页，
 * 动态页是懒加载路由、进不来那份 CSS，所以这里渲染出来的节点样式全丢。
 */
export default function Page({ id, path, close }: { id: string, path: string, close: Function }) {
  return <TemplateView template_id={id} mode="preview" path={path} close={close} />
}
