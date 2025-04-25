import Menu from './Menu'
import MenuItem from './MenuItem'
import Tab from './Tab'
import Tabbar from './Tabbar'
import TabItem from './TabItem'
import Filter from './Filter'
import FilterRow from './FilterRow'
import FilterTag from './FilterTag'
import Layout from './Layout'
import PickCard from './Card'
import RandomCard from './Random'
import IconBtn from './Image'
import CText from './Text'
import CButton from './Button'
import CSelect from './Select'
import CInput from './Input'
import TextArea from './TextArea'
import CIcon from './Icon'
import Table from './Table'
import TableColumn from './TableColumn'
import Form from './Form'
import Row from './Row'
import Col from './Col'
import Switch from './Switch'
import Radio from './Radio'
import CheckBox from './Checkbox'
import Field from './Field'
import Upload from './Upload'
import Tags from './TagList'
import Objects from './ObjectList'
import Tpl from './Tpl'
import CodeEditor from './CodeEditor'

/**
 * 组件与属性 attr
 * Layout: layout(0,1)
 * HotArea: columns(number)
 * Button: type, action, action_url
 * Icon: 
 * Tags: 依赖source的字符串数组
 * Text
 * Tpl: value
 * Image
 * 
 * Form:
 * Field: grids,left,right
 * Row: layout
 * Col: layout,offsetSpan,Span
 * Upload
 * Input
 * TextArea
 * Radio: 
 * CheckBox: 
 * Select: value,refer
 * 
 * Filter:
 * FilterRow:
 * FilterTag:
 * 
 * Tab: content_type, template_id
 * TabItem:
 * 
 * Table
 * TableColumn
 * 
 * Menu
 * MenuItem
 * Card:
 * Random
 */

const components = {
  Menu,
  MenuItem,
  Tabbar,
  Tab,
  TabItem,
  Filter,
  FilterRow,
  FilterTag,
  Layout,
  PickCard,
  RandomCard,
  IconBtn,
  Image: IconBtn,
  Text: CText,
  Button: CButton,
  Input: CInput,
  TextArea,
  Select: CSelect,
  Icon: CIcon,
  Table,
  TableColumn,
  Form,
  Row,
  Col,
  Field,
  Radio,
  Tpl,
  Tags,
  Objects,
  Upload,
  CodeEditor,
  CheckBox,
  Switch,
}

export default components;