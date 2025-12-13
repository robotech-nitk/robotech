import { useState } from 'react'
import { Route,Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

function App() {
  return(
    <div>
        <Routes>
          <Route path='/' element={<LandingPage></LandingPage>}></Route>
        </Routes>
    </div>
  
  )
}

export default App
