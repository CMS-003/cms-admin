import React from 'react'
import { Route, Routes } from 'react-router-dom'
import ComponentPage from '../pages/component'
import ComponentTypePage from '../pages/component/type'
import ComponentTamplatePage from '../pages/component/template'

const App = () => (
  <Routes>
    <Route path="/" element={<div>Hello World!</div>} />
    <Route path="/component/type" element={<ComponentTypePage />} />
    <Route path="/component/data" element={<ComponentPage />} />
    <Route path="/component/template" element={<ComponentTamplatePage />} />
    <Route path="*" element={<div>404 Not Found</div>} />
  </Routes>
)

export default App