import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidLink, setIsValidLink] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the recovery link successfully logged the user in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidLink(true);
      } else {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Password updated successfully! Please log in with your new password.');
      navigate('/login');
    }
    setLoading(false);
  };

  if (!isValidLink && !error) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Verifying link...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Set New Password</h2>
        <p className="text-center text-gray-500 mb-6">Enter your new password below.</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {isValidLink ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="At least 6 characters"
                minLength={6}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-300"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
              Request a new reset link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpdatePassword;