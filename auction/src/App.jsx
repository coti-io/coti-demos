import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BidderPage from './pages/BidderPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<BidderPage />} />
            </Routes>
        </Router>
    );
}

export default App;
