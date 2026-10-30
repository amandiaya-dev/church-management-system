import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { AuthContext } from './AuthContext';

function MemberProfile() {
  const { id } = useParams();
  const { user, userRole } = useContext(AuthContext);
  
  const [member, setMember] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [myGroupId, setMyGroupId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      // Fetch all small groups for the dropdown
      const { data: groupsData } = await supabase
        .from('small_groups')
        .select('id, name')
        .order('name', { ascending: true });

      if (memberError) {
        console.error("Error fetching profile:", memberError);
      } else {
        setMember(memberData);
        setEditData(memberData);
      }
      
      if (groupsData) setGroups(groupsData);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Fetch the logged-in user's group for privacy check
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

  const handleEditClick = () => setIsEditing(true);
  const handleCancel = () => {
    setEditData(member);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    const { data, error } = await supabase
      .from('members')
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        email: editData.email,
        phone: editData.phone,
        status: editData.status,
        group_id: editData.group_id === '' ? null : editData.group_id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating member:", error);
      alert("Failed to update member.");
    } else {
      setMember(data);
      setIsEditing(false);
      alert("Member updated successfully!");
    }
    setSaving(false);
  };

  if (loading) return <p className="p-8 text-gray-500">Loading profile...</p>;
  if (!member) return <p className="p-8 text-red-500">Member not found.</p>;

  // Find the group name for display
  const currentGroupName = groups.find(g => g.id === member.group_id)?.name || 'Not assigned to a group';

  // Privacy check: Can this user see contact details?
  const canViewContact = () => {
    // Admins can see everything
    if (userRole === 'admin') return true;
    
    // Members can see contact info if they're in the same small group
    if (myGroupId && member.group_id && member.group_id === myGroupId) return true;
    
    return false;
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block">
        ← Back to Directory
      </Link>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {member.first_name[0]}{member.last_name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{member.first_name} {member.last_name}</h1>
              <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
                member.status === 'member' ? 'bg-green-100 text-green-800' :
                member.status === 'leader' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </span>
            </div>
          </div>

          {userRole === 'admin' && !isEditing && (
            <button onClick={handleEditClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Edit Profile
            </button>
          )}
        </div>

        {/* VIEW MODE */}
        {!isEditing && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Small Group</p>
              <p className="text-lg text-gray-900 font-medium">{currentGroupName}</p>
            </div>
            
            {/* Email - only show if admin or same group */}
            <div>
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              {canViewContact() ? (
                <p className="text-lg text-gray-900">{member.email}</p>
              ) : (
                <p className="text-lg text-gray-400 italic">Hidden for privacy</p>
              )}
            </div>
            
            {/* Phone - only show if admin or same group */}
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              {canViewContact() ? (
                <p className="text-lg text-gray-900">{member.phone || 'Not provided'}</p>
              ) : (
                <p className="text-lg text-gray-400 italic">Hidden for privacy</p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-lg text-gray-900">
                {new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Small Group</label>
              <select
                name="group_id"
                value={editData.group_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Not assigned to a group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input name="first_name" value={editData.first_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input name="last_name" value={editData.last_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={editData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" type="tel" value={editData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={editData.status} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="visitor">Visitor</option>
                <option value="member">Member</option>
                <option value="leader">Leader</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-300">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancel} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberProfile;