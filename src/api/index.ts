import shttp, { BaseResultWrapper, BaseWrapper } from "../utils/shttp";
import user from './user'
import config from './config'
import component from './component'
import project from './project'
import sns from './sns'
import file from './file'
import template from './template'
import resource from './resource'
import componentType from './component-type'
import schema from './schema'
import { IComponent, IComponentType, ILog, ITemplate } from "@/types";
import { keyBy } from 'lodash'
import qs from 'qs'

function fillAccepts(child: IComponent, map: { [key: string]: IComponentType }) {
  if (map[child.type]) {
    child.accepts = map[child.type].accepts;
  }
  if (child.children) {
    child.children.forEach(sun => fillAccepts(sun, map))
  }
}
const apis = {
  getTemplateComponents: async (template_id: string, page: number = 1, size: number = 10): Promise<BaseWrapper<ITemplate & { children: IComponent[] }>> => {
    const results = await shttp.get<ITemplate & { children: IComponent[] }>(`/gw/api/v1/templates/${template_id}/components?page=${page}&size=${size}`);
    return new Promise((resolve, reject) => {
      import('../store').then(store => {
        if (store.default.component.types.length) {
          const map = keyBy(store.default.component.types, 'type')
          results.data.children.forEach((child: any) => fillAccepts(child, map))
        }
        resolve(results)
      }).catch(e => {
        reject(e)
      })
    })

  },
  getBoot: async () => {
    // component-type,projects,admin template
    const templateResult = await apis.getTemplateComponents('admin');
    const typesResult = await componentType.getComponentTypes();
    const projectsResult = await project.getProjects();
    return {
      tree: templateResult.data,
      types: typesResult.data,
      projects: projectsResult.data,
    }
  },
  getLogs: async (query: object) => {
    return await shttp.get<ILog>(`/gw/api/v1/logs/system?${qs.stringify(query)}`)
  },
  ...config,
  ...component,
  ...project,
  ...template,
  ...componentType,
  ...user,
  ...resource,
  ...sns,
  ...file,
  ...schema,
}

export default apis;