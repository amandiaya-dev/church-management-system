import { createContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'member'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on page load
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch the user's role from the members table
        const { data: memberData } = await supabase
          .from('members')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(memberData?.role || 'member');
      }
      
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        // Fetch role when user logs in
        supabase
          .from('members')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || 'member');
          });
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}