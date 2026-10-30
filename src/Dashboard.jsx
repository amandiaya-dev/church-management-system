import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { AuthContext } from './AuthContext';

function Dashboard() {
  const { user, userRole } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [myGroupId, setMyGroupId] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase.from('members').select('*');
      
      if (error) {
        console.error("Error fetching members:", error);
      } else {
        setMembers(data);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  // Fetch the logged-in user's group
  useEffect(() => {
    const fetchMyGroup = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('members')
        .select('group_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setMyGroupId(data.group_id);
    };

    fetchMyGroup();
  }, [user]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery === '' || 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Privacy check: Can this user see contact details?
  const canViewContact = (member) => {
    // Admins can see everything
    if (userRole === 'admin') return true;
    
    // Members can see contact info if they're in the same small group
    if (myGroupId && member.group_id === myGroupId) return true;
    
    return false;
  };

  if (loading) return <p className="p-8 text-gray-500">Loading church data...</p>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Member Directory</h1>
          <p className="text-gray-500 mt-1">
            {userRole === 'admin' 
              ? 'Manage your congregation and visitors' 
              : 'View our church community'}
          </p>
        </div>
        
        {userRole === 'admin' && (
          <Link 
            to="/members/new" 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
          >
            <span>+</span> Add New Member
          </Link>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="min-w-[150px]">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="member">Members</option>
              <option value="visitor">Visitors</option>
              <option value="leader">Leaders</option>
            </select>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          Showing {filteredMembers.length} of {members.length} members
        </p>
      </div>
      
      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">
            {searchQuery || statusFilter !== 'all' 
              ? 'No members match your search criteria.' 
              : 'No members found yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Link 
              to={`/member/${member.id}`} 
              key={member.id} 
              className="block bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{member.first_name} {member.last_name}</h3>
                  
                  {/* Show email only if allowed */}
                  {canViewContact(member) ? (
                    <p className="text-gray-600 text-sm mt-1">{member.email}</p>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1 italic">Contact info hidden</p>
                  )}
                  
                  {/* Show phone only if allowed */}
                  {member.phone && canViewContact(member) && (
                    <p className="text-gray-500 text-sm">{member.phone}</p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    member.status === 'member' ? 'bg-green-100 text-green-800' :
                    member.status === 'leader' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {member.status}
                  </span>
                  
                  {/* Show group badge if they're in one */}
                  {member.group_id && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      Group
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;