import { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient';
import { AuthContext } from './AuthContext';

function SmallGroupsPage() {
  const { user, userRole } = useContext(AuthContext);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [joining, setJoining] = useState(null); // which group button is loading

  // The logged-in user's member record
  const [myMemberId, setMyMemberId] = useState(null);
  const [myGroupId, setMyGroupId] = useState(null);

  // Counts of members in each group
  const [memberCounts, setMemberCounts] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meeting_day: '',
    meeting_time: '',
    leader_name: ''
  });

  // 1. Fetch all small groups
  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('small_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching groups:", error);
      } else {
        setGroups(data);
      }
      setLoading(false);
    };
    fetchGroups();
  }, []);

  // 2. Fetch all members so we can show how many are in each group
  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from('members')
        .select('group_id');

      if (data) {
        const counts = {};
        data.forEach(member => {
          if (member.group_id) {
            counts[member.group_id] = (counts[member.group_id] || 0) + 1;
          }
        });
        setMemberCounts(counts);
      }
    };
    fetchCounts();
  }, [myGroupId]); // refresh counts when someone joins/leaves

  // 3. Find the logged-in user's member record (to know their group)
  useEffect(() => {
    const fetchMyMembership = async () => {
      if (!user) {
        setMyMemberId(null);
        setMyGroupId(null);
        return;
      }

      const { data, error } = await supabase
        .from('members')
        .select('id, group_id')
        .eq('user_id', user.id)
        .maybeSingle(); // maybeSingle returns null instead of error if no match

      if (error) {
        console.error("Error fetching your membership:", error);
      } else if (data) {
        setMyMemberId(data.id);
        setMyGroupId(data.group_id);
      }
    };

    fetchMyMembership();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 4. Admin: Create a group
  const handleAddGroup = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('small_groups')
      .insert([formData])
      .select();

    if (error) {
      console.error("Error adding group:", error);
      alert("Failed to add group. Check the console.");
      return;
    }

    setGroups([...groups, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData({
      name: '',
      description: '',
      meeting_day: '',
      meeting_time: '',
      leader_name: ''
    });
    setShowAddForm(false);
  };

  // 5. Admin: Delete a group
  const handleDeleteGroup = async (groupId) => {
    if (!confirm("Are you sure? Members assigned to this group will become unassigned.")) return;

    const { error } = await supabase
      .from('small_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group.");
      return;
    }

    setGroups(groups.filter(g => g.id !== groupId));
    setMemberCounts(prev => ({ ...prev, [groupId]: 0 }));
    if (myGroupId === groupId) setMyGroupId(null);
  };

  // 6. Member: Join or Leave a group
  const handleJoinLeave = async (groupId) => {
    if (!myMemberId) {
      alert("We couldn't find your member profile. Please contact your church admin.");
      return;
    }

    const isLeaving = myGroupId === groupId;
    const newGroupId = isLeaving ? null : groupId;

    setJoining(groupId);

    // Save to the database FIRST (no fake success)
    const { error } = await supabase
      .from('members')
      .update({ group_id: newGroupId })
      .eq('id', myMemberId);

    if (error) {
      console.error("Error updating group:", error);
      alert("Something went wrong. Please try again.");
    } else {
      setMyGroupId(newGroupId);
      alert(isLeaving ? "You left the group." : "You joined the group! Welcome!");
    }

    setJoining(null);
  };

  if (loading) return <p className="p-8 text-gray-500">Loading groups...</p>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Small Groups</h1>
          <p className="text-gray-500 mt-1">Connect with our church community</p>
        </div>

        {userRole === 'admin' && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            + Create Group
          </button>
        )}
      </div>

      {/* Your current group banner (for members) */}
      {userRole !== 'admin' && myGroupId && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-3 rounded-xl mb-6 flex items-center gap-2">
          <span>✓</span>
          <span>
            You're in: <strong>{groups.find(g => g.id === myGroupId)?.name}</strong>
          </span>
        </div>
      )}

      {/* Create Group Form (Admin Only) */}
      {showAddForm && userRole === 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Small Group</h2>

          <form onSubmit={handleAddGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Young Adults Ministry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Who is this group for?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day</label>
                <input
                  name="meeting_day"
                  value={formData.meeting_day}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., Tuesdays"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Time</label>
                <input
                  name="meeting_time"
                  value={formData.meeting_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 7:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leader Name</label>
              <input
                name="leader_name"
                value={formData.leader_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Pastor John"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Create Group
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-2 bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-500">No small groups created yet.</p>
          </div>
        ) : (
          groups.map((group) => {
            const isMyGroup = myGroupId === group.id;
            const count = memberCounts[group.id] || 0;

            return (
              <div
                key={group.id}
                className={`bg-white p-6 rounded-xl shadow-sm border transition-shadow relative ${
                  isMyGroup
                    ? 'border-green-400 ring-2 ring-green-100'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {userRole === 'admin' && (
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                  {isMyGroup && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Your Group
                    </span>
                  )}
                </div>

                {group.description && (
                  <p className="text-gray-600 mb-4">{group.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-700 mb-5">
                  {group.meeting_day && (
                    <p>
                      📅 <span className="font-semibold">When:</span>{' '}
                      {group.meeting_day} {group.meeting_time && `at ${group.meeting_time}`}
                    </p>
                  )}
                  {group.leader_name && (
                    <p>
                      👤 <span className="font-semibold">Leader:</span> {group.leader_name}
                    </p>
                  )}
                  <p>
                    👥 <span className="font-semibold">{count}</span> member{count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Real Join / Leave button for members */}
                {userRole !== 'admin' && (
                  <button
                    onClick={() => handleJoinLeave(group.id)}
                    disabled={joining === group.id}
                    className={`w-full font-semibold py-2.5 rounded-lg transition-colors border ${
                      isMyGroup
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    } disabled:opacity-50`}
                  >
                    {joining === group.id
                      ? 'Saving...'
                      : isMyGroup
                      ? 'Leave Group'
                      : 'Join This Group'}
                  </button>
                )}

                {/* Admin hint */}
                {userRole === 'admin' && (
                  <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                    Assign members via their profile → Edit Profile → Small Group
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SmallGroupsPage;