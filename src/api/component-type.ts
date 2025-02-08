import shttp from "../utils/shttp";
import { IComponentType } from '../types'

const apis = {
  getComponentTypes: async () => {
    const result = await shttp.get<IComponentType>(`/api/v1/component-types`)
    const containers: IComponentType[] = [];
    const components: IComponentType[] = [];
    const widgets: IComponentType[] = [];
    result.data.items.forEach(t => {
      if (t.group === 'container') {
        containers.push(t);
      } else if (t.group === 'component') {
        components.push(t);
      } else if (t.group === 'widget') {
        widgets.push(t);
      }
    });
    result.data.items = [...containers, ...components, ...widgets];
    return result
  },
  addComponentTypes: async ({ body }: { body: IComponentType }) => {
    const result: any = await shttp.post(`/api/v1/component-types`, body)
    return result
  },
  updateComponentTypes: async ({ body }: { body: IComponentType }) => {
    const result: any = await shttp.put(`/api/v1/component-types/${body._id}`, body)
    return result
  },
  destroyComponentTypes: async ({ params }: { params: any }) => {
    const result: any = await shttp.delete(`/api/v1/component-types/${params._id}`)
    return result
  },
}

export default apis