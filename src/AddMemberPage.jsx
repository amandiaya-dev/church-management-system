import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function AddMemberPage() {
  const navigate = useNavigate();
  
  // 1. Controlled Inputs: State for each form field
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'visitor' // Default value
  });
  
  const [loading, setLoading] = useState(false);

  // 2. Handle typing in the inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value // Updates the specific field they are typing in
    }));
  };

  // 3. Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop page refresh
    setLoading(true);

    // Send data to Supabase!
    const { data, error } = await supabase
      .from('members')
      .insert([formData]);

    if (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Check console for details.");
    } else {
      alert("Member added successfully!");
      navigate('/dashboard'); // Redirect back to dashboard
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Add New Member</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="visitor">Visitor</option>
              <option value="member">Member</option>
              <option value="leader">Leader</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-300"
          >
            {loading ? 'Saving...' : 'Save Member'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddMemberPage;