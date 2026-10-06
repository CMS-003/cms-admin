import { IComponent, ITemplate, IWidget } from "@/types";

export function getDiff(t: ITemplate | IComponent | null) {
  if (!t) {
    return [];
  }
  const results: any[] = [];
  if (t.children) {
    t.children.forEach((child: IComponent) => {
      const diff = child.diff()
      if (diff) {
        results.push(child.toJSON())
      }
      const subResults = getDiff(child);
      if (subResults.length) {
        results.push(...subResults)
      }
    })
  }
  return results;
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