import React from 'react'
import { Observer } from 'mobx-react'
import { ITemplate, IComponent } from '@/types'
import { Menu } from 'antd'
import { transform } from '../layout/menu'

function Component({ data, ...props }: { data: IComponent, props?: any }) {
    if (data.type === 'Menu') {
        const tree = transform(data)
        return <Menu style={{ width: 200 }} items={tree.children} />
    }
    return <div>
        {data.title}
        {data.children && data.children.map((child: IComponent) => <Component data={child} />)}
    </div>
}

function TemplatePage({ template, ...props }: { template: ITemplate | null, props?: any }) {
    if (template && template.children) {
        return <div>{template.children.map(child => <Component data={child} />)}</div>
    } else if (template) {
        return <div>Empty Page</div>
    } else {
        return <div>Page NotFound</div>
    }
}

export default function Page({ template, props }: { props?: any, template: ITemplate | null }) {
    return <Observer>{() => (<div style={{ display: 'flex', justifyContent: 'center', }}>
        <TemplatePage template={template} />
    </div>)}</Observer>
}