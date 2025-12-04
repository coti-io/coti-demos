import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MultiBidderPage from './pages/MultiBidderPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MultiBidderPage />} />
            </Routes>
        </Router>
    );
}

export default App;
