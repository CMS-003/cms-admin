import React from 'react'
import { HashRouter as Router, Route } from 'react-router-dom'
import CacheRoute, { CacheSwitch } from 'react-router-cache-route'

const App = () => (
  <Router>
    <CacheSwitch>
      <CacheRoute exact path="/list" component={<div>list</div>} />
      <Route exact path="/item/:id" component={<div>detail</div>} />
      <Route render={() => <div>404 Not Found</div>} />
    </CacheSwitch>
  </Router>
)

export default App