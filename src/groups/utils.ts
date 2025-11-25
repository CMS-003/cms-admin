import { ITemplate, IComponent, IWidget } from '@/types'


export function getDiff(t: ITemplate | IComponent | null) {
  if (!t) {
    return [];
  }
  const results: IComponent[] = [];
  if (t.children) {
    t.children.forEach((child) => {
      const diff = child.diff()
      if (diff) {
        results.push((child as IComponent).toJSON())
      }
      const subResults = getDiff(child);
      if (subResults.length) {
        results.push(...subResults)
      }
    })
  }
  return results;
}

export function findNode(arr: IComponent[], id: string): IComponent | null {
  let result: IComponent | null = null;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v._id === id) {
      return v;
    }
    result = findNode(v.children, id);
    if (result) {
      return result;
    }
  }
  return null;
}

export function collectIds(tree: IComponent, arr: string[]) {
  arr.push(tree._id);
  tree.children.forEach(t => collectIds(t, arr));
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