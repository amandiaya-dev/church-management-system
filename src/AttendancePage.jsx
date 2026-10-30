import { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient';
import { AuthContext } from './AuthContext';

function AttendancePage() {
  const { userRole } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({}); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServiceType, setSelectedServiceType] = useState('sunday_morning');
  const [loading, setLoading] = useState(true);

  // Service type options
  const serviceTypes = [
    { value: 'sunday_morning', label: 'Sunday Morning Service' },
    { value: 'sunday_evening', label: 'Sunday Evening Service' },
    { value: 'wednesday_bible_study', label: 'Wednesday Bible Study' },
    { value: 'prayer_meeting', label: 'Prayer Meeting' },
    { value: 'special_event', label: 'Special Event' }
  ];

  // 1. Fetch all church members
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from('members').select('id, first_name, last_name, status');
      if (data) setMembers(data);
    };
    fetchMembers();
  }, []);

  // 2. Fetch attendance records for the selected date AND service type
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('attendance')
        .select('id, member_id, status')
        .eq('service_date', selectedDate)
        .eq('service_type', selectedServiceType); // Filter by service type too!
      
      const attendanceMap = {};
      if (data) {
        data.forEach(row => {
          attendanceMap[row.member_id] = { id: row.id, status: row.status };
        });
      }
      setAttendance(attendanceMap);
      setLoading(false);
    };
    fetchAttendance();
  }, [selectedDate, selectedServiceType]); // Re-run when date OR service type changes

  // 3. Set attendance to a specific status (present or absent)
  const handleSetAttendance = async (memberId, newStatus) => {
    const currentRecord = attendance[memberId];
    
    if (currentRecord?.status === newStatus) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: { id: currentRecord?.id, status: newStatus }
    }));

    if (currentRecord?.id) {
      const { error: updateError } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', currentRecord.id);
      if (updateError) console.error("Update error:", updateError);
    } else {
      const { error: insertError, data } = await supabase
        .from('attendance')
        .insert({
          member_id: memberId,
          service_date: selectedDate,
          service_type: selectedServiceType, // Include service type!
          status: newStatus
        })
        .select();
      
      if (insertError) {
        console.error("Insert error:", insertError);
      } else if (data && data.length > 0) {
        setAttendance(prev => ({
          ...prev,
          [memberId]: { id: data[0].id, status: newStatus }
        }));
      }
    }
  };

  // 4. Calculate Report Stats
  const totalMembers = members.length;
  const presentCount = Object.values(attendance).filter(r => r.status === 'present').length;
  const absentCount = Object.values(attendance).filter(r => r.status === 'absent').length;
  const unmarkedCount = totalMembers - presentCount - absentCount;
  const attendancePercentage = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

  // Get the label for the current service type
  const currentServiceLabel = serviceTypes.find(s => s.value === selectedServiceType)?.label || 'Service';

  if (loading && members.length === 0) return <p className="p-8 text-gray-500">Loading church data...</p>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-gray-500 mt-1">Track and report on service attendance</p>
        </div>
        
        {/* Date and Service Type Selectors */}
        <div className="flex gap-3 flex-wrap">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          />
          <select 
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          >
            {serviceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 REPORT SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalMembers}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl shadow-sm border border-green-200">
          <p className="text-sm font-medium text-green-700">Present</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{presentCount}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-xl shadow-sm border border-red-200">
          <p className="text-sm font-medium text-red-700">Absent</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{absentCount}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl shadow-sm border border-blue-200">
          <p className="text-sm font-medium text-blue-700">Attendance Rate</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">{attendancePercentage}%</p>
        </div>
      </div>

      {/* Member List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">
            {currentServiceLabel} - Check-in List
          </h3>
          <span className="text-sm text-gray-500">{unmarkedCount} unmarked</span>
        </div>
        
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading attendance records...</p>
        ) : (
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {members.map((member) => {
              const record = attendance[member.id];
              const isPresent = record?.status === 'present';
              const isAbsent = record?.status === 'absent';
              
              return (
                <li key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.first_name} {member.last_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.status}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetAttendance(member.id, 'present')}
                      className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all min-w-[90px] ${
                        isPresent 
                          ? 'bg-green-600 text-white shadow-md' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      ✓ Present
                    </button>
                    <button
                      onClick={() => handleSetAttendance(member.id, 'absent')}
                      className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all min-w-[90px] ${
                        isAbsent
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      ✗ Absent
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        
        {members.length === 0 && !loading && (
          <p className="p-8 text-center text-gray-500">No members found. Add some members first!</p>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;