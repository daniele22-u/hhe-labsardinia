import { createRoot } from 'react-dom/client'
// Inter self-hosted via Fontsource (SIL OFL): no requests to Google Fonts
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
