import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import casesService from '../services/casesService';

const CasesPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCases();
  }, [filterStatus, page]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: 10,
      };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await casesService.getCases(params);
      setCases(response.data.results || response.data || []);
      const total = response.data.count || 0;
      setTotalPages(Math.ceil(total / 10));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-blue-100 text-blue-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      investigation: 'bg-purple-100 text-purple-800',
      suspect_identified: 'bg-orange-100 text-orange-800',
      interrogation: 'bg-red-100 text-red-800',
      pending_captain: 'bg-indigo-100 text-indigo-800',
      trial: 'bg-cyan-100 text-cyan-800',
      closed_solved: 'bg-green-100 text-green-800',
      closed_unsolved: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Cases</h1>
            <p className="text-gray-600 mt-2">Total: {cases.length} cases</p>
          </div>
          <Link
            to="/cases/new"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            Create New Case
          </Link>
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
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Cases</option>
              <option value="created">Created</option>
              <option value="investigation">Investigation</option>
              <option value="suspect_identified">Suspect Identified</option>
              <option value="trial">Trial</option>
              <option value="closed_solved">Solved</option>
              <option value="closed_unsolved">Unsolved</option>
            </select>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {cases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">No cases found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Case ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Crime Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                        #{caseItem.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {caseItem.crime_type || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {caseItem.crime_severity || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg font-semibold ${
                page === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            <span className="text-gray-700 font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold ${
                page === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesPage;
