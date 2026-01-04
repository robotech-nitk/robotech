import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import AppErrorBoundary from "./components/AppErrorBoundary";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
       <AppErrorBoundary>
           <App />
       </AppErrorBoundary>
  </BrowserRouter>
 
   
 
)
