import React, { Fragment } from 'react'
import { Observer } from 'mobx-react-lite'

export default function VisualBox({ visible, children }: { visible: boolean, children: any }) {
  return <Observer>
    {() => {
      return <Fragment>
        {visible && children}
      </Fragment>
    }}
  </Observer>
}