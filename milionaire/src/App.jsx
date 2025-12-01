import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { GlobalBackground } from './components/GlobalBackground'
import { light as theme } from './config/theme'
import HomePage from './pages/HomePage'
import AlicePage from './pages/AlicePage'
import BobPage from './pages/BobPage'

function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalBackground>
                <Router>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/alice" element={<AlicePage />} />
                        <Route path="/bob" element={<BobPage />} />
                    </Routes>
                </Router>
            </GlobalBackground>
        </ThemeProvider>
    )
}

export default App
