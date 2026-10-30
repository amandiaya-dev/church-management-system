import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

function LandingPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(3);

      if (error) console.error("Error fetching events:", error);
      else setUpcomingEvents(data || []);
      setLoadingEvents(false);
    };

    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) console.error("Error fetching services:", error);
      else {
        // Sort by day order
        const sorted = (data || []).sort((a, b) => 
          dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
        );
        setServices(sorted);
      }
      setLoadingServices(false);
    };

    fetchEvents();
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-extrabold text-gray-900 mb-6">
            GraceHub
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            The Modern Church Management System
          </p>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Connect with your congregation, track attendance, and manage your church community with ease. Built for pastors, by developers who understand ministry.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              to="/join" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Join Our Church
            </Link>
            <Link 
              to="/services" 
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
            >
              View Services
            </Link>
            <Link 
              to="/login" 
              className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Join Us for Worship
            </h2>
            <p className="text-lg text-gray-600">
              Our weekly services and gatherings
            </p>
          </div>
          
          {loadingServices ? (
            <div className="text-center">
              <p className="text-gray-500">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center bg-gray-50 p-12 rounded-xl border border-dashed border-gray-300 max-w-2xl mx-auto">
              <p className="text-gray-500 text-lg">Service times coming soon.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later or contact us for details.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl text-center mb-4">
                    <p className="text-xs uppercase tracking-wide opacity-90">Every</p>
                    <p className="text-xl font-bold">{service.day_of_week}</p>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-700 mb-3">
                    <p>🕐 {service.time}</p>
                    {service.location && <p>📍 {service.location}</p>}
                  </div>
                  
                  {service.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-gray-600">
              Special services and gatherings
            </p>
          </div>
          
          {loadingEvents ? (
            <div className="text-center">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-xl border border-dashed border-gray-300 max-w-2xl mx-auto">
              <p className="text-gray-500 text-lg">No upcoming events scheduled yet.</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold mb-4 inline-block">
                    {new Date(event.event_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-1 text-sm text-gray-700">
                    {event.event_time && (
                      <p>🕐 {event.event_time}</p>
                    )}
                    {event.location && (
                      <p>📍 {event.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Manage Your Church
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Member Directory</h3>
              <p className="text-gray-600">
                Keep track of all your members, visitors, and leaders in one organized place.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Attendance Tracking</h3>
              <p className="text-gray-600">
                Easily mark who attended each service and see trends over time.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Role-based access ensures only admins can make changes while members can view safely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 GraceHub. Built with ❤️ for the church community.</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;