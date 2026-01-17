import {
  Upload,
  Copy,
  X,
  User,
  Loader,
  Plus,
  Check,
  CopyMinus,
  ChevronRight,
  Move,
  MoveLeft,
  MoveRight,
  Settings,
  CirclePlus,
  CircleCheck,
  CircleAlert,
  CircleX,
  Music,
  FolderKanban,
  Trash,
  Trash2,
  FileSearch,
  RefreshCcw,
  RefreshCw,
  TriangleAlert,
  Cable,
  MonitorCog,
  CircleQuestionMark,
  LucideProps,
  ChartLine,
  FolderCog,
  ScanLine,
  CalendarSync,
  Book,
  SquareLibrary,
  Download,
  Bug,
  ImagePlay,
  Video,
  Image,
  Album,
  Captions,
  Puzzle,
  Database,
  Group,
  LayoutList,
  Component,
  List,
  Link,
  LayoutTemplate,
  FileClock,
  CalendarRange,
  ShieldCheck,
  Edit,
  View,
  Eye,
  House,
  Star,
  History,
  Bell,
  Mail,
  Menu,
  CirclePercent,
  MessageSquare,
} from 'lucide-react';
import styled from 'styled-components';

const Map: { [key: string]: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> } = {
  Loader,
  RefreshCw,
  RefreshCcw,
  Upload,
  Download,
  Copy,
  Edit,
  X,
  Trash,
  Trash2,
  Bug,
  House,
  User,
  Settings,
  ScanLine,
  Link,
  Plus,

  Check,
  CopyMinus,
  ChevronRight,
  Move,
  MoveLeft,
  MoveRight,

  Progress: CirclePercent,
  CirclePlus,
  CircleCheck,
  CircleAlert,
  CircleX,
  Music,
  FolderKanban,
  FileSearch,
  TriangleAlert,
  Cable,
  MonitorCog,
  ChartLine,
  FolderCog,
  CalendarSync,
  Book,
  SquareLibrary,
  ImagePlay,
  Video,
  Image,
  Album,
  Captions,
  Puzzle,
  Database,
  Group,
  LayoutList,
  Component,
  List,
  LayoutTemplate,
  FileClock,
  CalendarRange,
  ShieldCheck,
  View,
  Eye,
  Star,
  History,
  Bell,
  Mail,
  Menu,
  Tip: MessageSquare
}

const Wrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
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
  const Icon = Map[icon] || CircleQuestionMark;
  if (!prop.hidden) {
    return <Wrap style={{ ...prop.style, color: prop.color, }} {...props}>
      <Icon name={icon} style={{ transform: `rotate(${prop.rotate || 0})` }} size={prop.size || 18} /> {prop.title}
    </Wrap>
  }
  return null;
}