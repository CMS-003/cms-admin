import React from 'react';
import Layout from './layout'
import * as apis from './api'
import { useEffectOnce } from 'react-use';

function App() {
  useEffectOnce(() => {
    apis.getComponents().then(menu => {
      console.log(menu)
    })
  });
  return (
    <div className="App">
      <Layout />
    </div>
  );
}

export default App;
