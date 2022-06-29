import React, { useCallback } from 'react';
import logo from './logo.svg';
import './App.css';
import shttp from './utils/shttp';
import { message } from 'antd';

function App() {
  const test = useCallback(async () => {
    try {
      const result = await shttp.get('/v1/public/menus');
      message.info(result.status);
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
          <button onClick={test}>test shttp</button>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
