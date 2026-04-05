import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Zones from './pages/Zones'
import Reports from './pages/Reports'
import Safety from './pages/Safety'
import Heatmap from './pages/Heatmap'
import ShiftReport from './pages/ShiftReport'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/shift-report" element={<ShiftReport />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
