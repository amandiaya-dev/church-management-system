import { useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient';
import { AuthContext } from './AuthContext';

function EventsPage() {
  const { userRole } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: ''
  });

  // Fetch all events, sorted by date
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('events')
      .insert([formData])
      .select();

    if (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event. Please try again.");
    } else {
      setEvents([...events, data[0]].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
      setFormData({ title: '', description: '', event_date: '', event_time: '', location: '' });
      setShowAddForm(false);
      alert("Event added successfully!");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event.");
    } else {
      setEvents(events.filter(event => event.id !== eventId));
      alert("Event deleted successfully!");
    }
  };

  // Separate past and upcoming events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(event => event.event_date >= today);
  const pastEvents = events.filter(event => event.event_date < today);

  if (loading) return <p className="p-8 text-gray-500">Loading events...</p>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Church Events</h1>
          <p className="text-gray-500 mt-1">Upcoming and past church events</p>
        </div>
        
        {userRole === 'admin' && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
          >
            <span>+</span> Add Event
          </button>
        )}
      </div>

      {/* Add Event Form (Admin Only) */}
      {showAddForm && userRole === 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Event</h2>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Youth Group Meeting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Brief description of the event..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  name="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  name="event_time"
                  type="text"
                  value={formData.event_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 2:00 PM"
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

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Create Event
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

      {/* Upcoming Events */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-500">No upcoming events scheduled.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {event.event_time && (
                        <span className="text-gray-600 text-sm">🕐 {event.event_time}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-600 mb-2">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-gray-500 text-sm">📍 {event.location}</p>
                    )}
                  </div>
                  
                  {userRole === 'admin' && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm ml-4"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Events</h2>
          <div className="grid gap-4 opacity-75">
            {pastEvents.map((event) => (
              <div key={event.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {event.event_time && (
                        <span className="text-gray-600 text-sm">🕐 {event.event_time}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-600 mb-2">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-gray-500 text-sm">📍 {event.location}</p>
                    )}
                  </div>
                  
                  {userRole === 'admin' && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm ml-4"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsPage;