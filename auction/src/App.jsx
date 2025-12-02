import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BidderPage from './pages/BidderPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/bidder" element={<BidderPage />} />
            </Routes>
        </Router>
    );
}

export default App;
