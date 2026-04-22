import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import HomeView from './views/HomeView';
import ExpertMode from './views/ExpertMode';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/"           element={<Landing />} />
          <Route path="/app"        element={<HomeView />} />
          <Route path="/visualizer" element={<ExpertMode />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}