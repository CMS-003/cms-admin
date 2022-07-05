import React from 'react';
import Layout from './layout'
import * as apis from './api'
import { useEffectOnce } from 'react-use';
import store from './store';

function App() {
  useEffectOnce(() => {
    apis.getComponents().then(data => {
      store.menu.setList(data.items)
    })
  });
  return (
    <div className="App">
      <Layout />
    </div>
  );
}

export default App;
