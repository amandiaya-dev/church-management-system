import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from './supabaseClient';

function Navbar({ appName }) {
  const { user, userRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide hover:text-blue-200">
        {appName}
      </Link>
      
      <div className="flex gap-6 items-center">
        <Link to="/" className="text-white hover:text-blue-200 font-medium transition-colors">
          Home
        </Link>
        <Link to="/services" className="text-white hover:text-blue-200 font-medium transition-colors">
          Services
        </Link>
        
        {user ? (
          <>
            <Link to="/dashboard" className="text-white hover:text-blue-200 font-medium transition-colors">
              Directory
            </Link>
            <Link to="/events" className="text-white hover:text-blue-200 font-medium transition-colors">
              Events
            </Link>
            <Link to="/groups" className="text-white hover:text-blue-200 font-medium transition-colors">
              Small Groups
            </Link>
            
            {userRole === 'admin' && (
              <>
                <Link to="/attendance" className="text-white hover:text-blue-200 font-medium transition-colors">
                  Attendance
                </Link>
                <Link to="/members/new" className="text-white hover:text-blue-200 font-medium transition-colors">
                  Add Member
                </Link>
                <Link to="/donations" className="text-white hover:text-blue-200 font-medium transition-colors">
  Donations
</Link>
              </>
            )}
            
            <button 
              onClick={handleLogout} 
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/join" className="text-white hover:text-blue-200 font-medium transition-colors">
              Join Us
            </Link>
            <Link to="/login" className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors">
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;