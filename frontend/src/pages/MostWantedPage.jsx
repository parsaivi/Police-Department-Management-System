import React, { useEffect, useState } from 'react';
import suspectService from '../services/suspectService';

const MostWantedPage = () => {
  const [suspects, setSuspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetchMostWanted();
  }, [filterSeverity]);

  const fetchMostWanted = async () => {
    try {
      setLoading(true);
      const params = filterSeverity !== 'all' ? { crime_severity: filterSeverity } : {};
      const response = await suspectService.getMostWanted(params);
      setSuspects(response.data.results || response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch most wanted list');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading most wanted list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-white">
          <h1 className="text-5xl font-bold mb-2">Most Wanted</h1>
          <p className="text-xl text-red-200">Dangerous Criminals</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Crime Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            >
              <option value="all">All Severities</option>
              <option value="1">Level 1 - Low</option>
              <option value="2">Level 2 - Medium</option>
              <option value="3">Level 3 - High</option>
              <option value="4">Level 4 - Critical</option>
            </select>
          </div>
        </div>

        {/* Suspects Grid */}
        {suspects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No suspects in most wanted list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suspects.map((suspect, idx) => (
              <div
                key={suspect.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105"
              >
                {/* Rank Badge */}
                <div className="bg-red-600 text-white p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">RANK #{idx + 1}</p>
                    <p className="text-2xl font-bold">Rials {(suspect.reward || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>

                {/* Suspect Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">NAME</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {suspect.first_name} {suspect.last_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">DAYS WANTED</p>
                      <p className="text-lg font-bold text-orange-600">
                        {suspect.days_wanted || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">SEVERITY</p>
                      <div
                        className={`text-lg font-bold ${
                          suspect.crime_severity <= 2
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        Level {suspect.crime_severity || 0}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-600">CRIMES</p>
                    <p className="text-gray-700">
                      {suspect.crimes?.join(', ') || 'No crimes listed'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-600">STATUS</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        suspect.status === 'most_wanted'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {suspect.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MostWantedPage;
