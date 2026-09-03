import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ReadingsPage } from './pages/ReadingsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export default function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-page lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/readings" element={<ReadingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
