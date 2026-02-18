import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import statsService from '../services/statsService';

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await statsService.getDashboardStats();
      setStats(response.data);

      // Build available modules based on user roles
      const userRoles = user?.groups || [];
      const availableModules = [];

      // Default modules for all
      availableModules.push({
        id: 'cases',
        title: 'Case Management',
        icon: '📋',
        description: 'View and manage cases',
        link: '/cases',
      });

      // Role-based modules
      if (userRoles.includes('cadet') || userRoles.includes('police_officer')) {
        availableModules.push({
          id: 'complaints',
          title: 'Complaints Review',
          icon: '📝',
          description: 'Review and process complaints',
          link: '/complaints',
        });
      }

      if (userRoles.includes('detective') || userRoles.includes('sergeant')) {
        availableModules.push({
          id: 'suspects',
          title: 'Suspect Investigation',
          icon: '🔍',
          description: 'Investigate suspects and manage wanted lists',
          link: '/suspects',
        });
      }

      if (userRoles.includes('judge')) {
        availableModules.push({
          id: 'judiciary',
          title: 'Judicial Proceedings',
          icon: '⚖️',
          description: 'Manage trials and verdicts',
          link: '/judiciary',
        });
      }

      if (userRoles.includes('detective') || userRoles.includes('sergeant')) {
        availableModules.push({
          id: 'detective_board',
          title: 'Detective Board',
          icon: '🎯',
          description: 'Manage detective notes and connections',
          link: '/detective-board',
        });
      }

      if (userRoles.includes('sergeant') || userRoles.includes('officer')) {
        availableModules.push({
          id: 'evidence',
          title: 'Evidence Management',
          icon: '🔬',
          description: 'Record and verify evidence',
          link: '/evidence',
        });
      }

      if (userRoles.includes('administrator')) {
        availableModules.push({
          id: 'admin',
          title: 'Admin Panel',
          icon: '⚙️',
          description: 'System administration',
          link: '/admin',
        });
      }

      setModules(availableModules);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-8 shadow-lg">
        <h1 className="text-4xl font-bold">Welcome, {user?.first_name || 'Officer'}</h1>
        <p className="text-blue-200 mt-2">
          Roles: {user?.groups?.join(', ') || 'Base User'}
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold">Active Cases</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {stats.active_cases || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold">Solved Cases</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {stats.total_solved_cases || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold">Total Staff</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {stats.total_staff || 0}
              </p>
            </div>
          </div>

          {/* Module Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Modules</h2>
            {modules.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">
                  No modules available for your role. Contact administrator.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <Link
                    key={module.id}
                    to={module.link}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 block"
                  >
                    <div className="text-4xl mb-4">{module.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                    <p className="text-gray-600 mt-2 text-sm">{module.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
