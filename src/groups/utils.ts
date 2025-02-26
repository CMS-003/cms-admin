import { ITemplate, IComponent } from '@/types'


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
