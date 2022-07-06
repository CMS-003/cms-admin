import React, { useCallback } from 'react';
import Layout from './layout'
import * as apis from './api'
import { useEffectOnce } from 'react-use';
import store from './store';
import { Component } from './types'
import { useLocalObservable, Observer } from 'mobx-react';
import { Spin } from 'antd';

function App() {
  const local = useLocalObservable(() => ({
    fetching: true,
    fetched: false,
  }))
  const init = useCallback(async () => {
    local.fetching = true
    try {
      const data = await apis.getComponents()
      data.items.forEach((item: Component) => {
        item.createdAt = new Date(item.createdAt || new Date())
        item.updatedAt = new Date(item.updatedAt || new Date())
        item.accepts = []
      })
      store.component.setList(data.items)
      local.fetched = true
    } finally {
      local.fetching = false
    }
  }, [])
  useEffectOnce(() => {
    init()
  });
  return (
    <Observer>{() => (
      <div className="App">
        {local.fetching ? <Spin /> : <Layout />}
      </div>
    )}</Observer>
  );
}

export default App;
