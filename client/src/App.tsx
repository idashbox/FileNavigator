import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileExplorerPage from './pages/FileExplorerPage';

const App: React.FC = () => (
    <Router>
        <Routes>
            <Route path="/" element={<FileExplorerPage />} />
            <Route path="/files/*" element={<FileExplorerPage />} />
        </Routes>
    </Router>
);

export default App;