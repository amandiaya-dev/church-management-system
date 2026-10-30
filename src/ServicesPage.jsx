import { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient';
import { AuthContext } from './AuthContext';

function ServicesPage() {
  const { userRole } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: '',
    time: '',
    location: '',
    description: ''
  });

  // Ordered days for display
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) console.error("Error fetching services:", error);
      else setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('services').insert([formData]).select();

    if (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service.");
      return;
    }

    setServices([...services, data[0]].sort((a, b) => 
      dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
    ));
    setFormData({ name: '', day_of_week: '', time: '', location: '', description: '' });
    setShowAddForm(false);
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) alert("Failed to delete.");
    else setServices(services.filter(s => s.id !== serviceId));
  };

  if (loading) return <p className="p-8 text-gray-500">Loading services...</p>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Our Services</h1>
          <p className="text-gray-500 mt-1">Join us for worship and fellowship</p>
        </div>
        {userRole === 'admin' && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            + Add Service
          </button>
        )}
      </div>

      {/* Add Service Form (Admin Only) */}
      {showAddForm && userRole === 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Service</h2>
          <form onSubmit={handleAddService} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Sunday Morning Worship"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a day</option>
                  {dayOrder.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 10:00 AM"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Main Sanctuary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="What to expect at this service..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Add Service
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

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
          <p className="text-gray-500 text-lg">No services scheduled yet.</p>
          {userRole === 'admin' && (
            <p className="text-gray-400 text-sm mt-2">Click "Add Service" to create your first one.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative"
            >
              {userRole === 'admin' && (
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              )}

              <div className="flex items-start gap-5">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl text-center min-w-[100px]">
                  <p className="text-xs uppercase tracking-wide opacity-90">Every</p>
                  <p className="text-lg font-bold">{service.day_of_week}</p>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    <span>🕐 {service.time}</span>
                    {service.location && <span>📍 {service.location}</span>}
                  </div>
                  {service.description && (
                    <p className="text-gray-600 mt-2">{service.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServicesPage;