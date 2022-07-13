import React from 'react';
import Layout from './layout'
import { Observer } from 'mobx-react';

function App() {
  return (
    <Observer>{() => (
      <div className="App">
        <Layout />
      </div>
    )}</Observer>
  );
}

export default App;
