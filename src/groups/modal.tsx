import { Observer } from "mobx-react";
import AutoPage from "./auto";
import { Modal } from "antd";

export default function ModalPage({ template_id, path, close }: { template_id: string, path: string, close: Function }) {
  return <Observer>{() => (
    <Modal
      title={path ? '修改' : '创建'}
      open={true}
      destroyOnClose={true}
      onCancel={() => {
        close()
      }}
      footer={null}
    >
      <AutoPage template_id={template_id} mode={'preview'} path={path} close={close} />
    </Modal>
  )}</Observer>
}