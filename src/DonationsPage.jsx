import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function DonationsPage() {
  const [donations, setDonations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    donation_type: 'tithe',
    donation_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const [donationsRes, membersRes] = await Promise.all([
        supabase.from('donations').select('*, members(first_name, last_name)').order('donation_date', { ascending: false }),
        supabase.from('members').select('id, first_name, last_name').order('last_name', { ascending: true })
      ]);

      if (donationsRes.data) setDonations(donationsRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'member_id' && value === '') {
      setFormData(prev => ({ ...prev, member_id: null }));
    }
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      member_id: formData.member_id === '' ? null : formData.member_id,
      amount: parseFloat(formData.amount)
    };

    const { data, error } = await supabase.from('donations').insert([payload]).select('*, members(first_name, last_name)');

    if (error) {
      console.error("Error adding donation:", error);
      alert("Failed to add donation.");
    } else {
      setDonations([data[0], ...donations]);
      setFormData({ member_id: '', amount: '', donation_type: 'tithe', donation_date: new Date().toISOString().split('T')[0], notes: '' });
      setShowAddForm(false);
    }
  };

  // Calculate stats
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const titheAmount = donations.filter(d => d.donation_type === 'tithe').reduce((sum, d) => sum + d.amount, 0);
  const offeringAmount = donations.filter(d => d.donation_type === 'offering').reduce((sum, d) => sum + d.amount, 0);

  if (loading) return <p className="p-8 text-gray-500">Loading financial data...</p>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donation Tracking</h1>
          <p className="text-gray-500 mt-1">Record and manage church finances</p>
        </div>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md">
            + Record Donation
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Recorded</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl shadow-sm border border-green-200">
          <p className="text-sm font-medium text-green-700">Total Tithes</p>
          <p className="text-3xl font-bold text-green-800 mt-1">${titheAmount.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl shadow-sm border border-blue-200">
          <p className="text-sm font-medium text-blue-700">Total Offerings</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">${offeringAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Record New Donation</h2>
          <form onSubmit={handleAddDonation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member (Optional)</label>
                <select name="member_id" value={formData.member_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Anonymous / Guest</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="donation_type" value={formData.donation_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="tithe">Tithe</option>
                  <option value="offering">Offering</option>
                  <option value="special">Special / Building Fund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input name="donation_date" type="date" value={formData.donation_date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <input name="notes" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g., Check #1234" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Save Donation</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Donations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No donations recorded yet.</td></tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(d.donation_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {d.members ? `${d.members.first_name} ${d.members.last_name}` : 'Anonymous / Guest'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      d.donation_type === 'tithe' ? 'bg-green-100 text-green-800' :
                      d.donation_type === 'offering' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {d.donation_type.charAt(0).toUpperCase() + d.donation_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${d.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{d.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DonationsPage;