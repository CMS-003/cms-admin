import React from 'react'
import { Route, Routes } from 'react-router-dom'
import ComponentPage from '../pages/component'
import IMPage from '../pages/im'

const App = () => (
  <Routes>
    <Route path="/" element={<div>Hello World!</div>} />
    <Route path="/component" element={<ComponentPage />} />
    <Route path="/im" element={<IMPage />} />
    <Route path="*" element={<div>404 Not Found</div>} />
  </Routes>
)

export default App