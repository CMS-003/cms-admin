import { DynamicIcon } from 'lucide-react/dynamic';
import styled from 'styled-components';

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
  font-size: 1rem;
  &:hover { 
    opacity: 0.7;
    color: var(--ant-primary-color-hover);
  }
`;

export default function Acon(prop: {
  icon: any,
  size?: number,
  color?: React.CSSProperties['color'],
  rotate?: React.CSSProperties['rotate'],
  title?: string,
  hidden?: boolean,
  style?: React.CSSProperties,
  className?: string,
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void,
  [key: string]: any;
}) {
  const { icon, size, color, rotate, title, hidden, style, ...props } = prop;
  if (!prop.hidden) {
    return <Wrap style={{ ...prop.style, color: prop.color, }} onClick={prop.onClick} {...props}>
      <DynamicIcon name={icon} style={{ transform: `rotate(${prop.rotate || 0})` }} size={prop.size || 18} /> {prop.title}
    </Wrap>
  }
  return null;
}