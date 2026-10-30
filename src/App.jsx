import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; 
import Navbar from './Navbar';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import AddMemberPage from './AddMemberPage';
import MemberProfile from './MemberProfile';
import AttendancePage from './AttendancePage';
import JoinPage from './JoinPage';
import EventsPage from './EventsPage';
import SmallGroupsPage from './SmallGroupsPage';
import ServicesPage from './ServicesPage';
import ProtectedRoute from './ProtectedRoute';
import DonationsPage from './DonationsPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import UpdatePassword from './UpdatePassword';
function App() {
  return (
    <AuthProvider> 
      <BrowserRouter>
        <Navbar appName="GraceHub" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/services" element={<ServicesPage />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member/:id" 
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AttendancePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/members/new" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AddMemberPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events" 
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <SmallGroupsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/donations" 
            element={
              <ProtectedRoute>
                <DonationsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePassword />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;