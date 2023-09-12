import { IComponent } from "@/types"
import { Observer } from "mobx-react"

export default function TabItem({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Observer>
    {() => (
      <div>
        {self.title}
      </div>
    )}
  </Observer>

}