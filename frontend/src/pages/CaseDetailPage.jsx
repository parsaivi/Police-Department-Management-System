import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import casesService from '../services/casesService';

const getSeverityLabel = (severity) => {
  const labels = {
    0: 'Critical',
    1: 'Level 1 - Severe',
    2: 'Level 2 - Major',
    3: 'Level 3 - Minor',
  };
  return labels[severity] || 'N/A';
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

const getSeverityColor = (severity) => {
  const colors = {
    0: 'bg-red-100 text-red-800',
    1: 'bg-orange-100 text-orange-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-green-100 text-green-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
};

const formatUserName = (user) => {
  if (!user) return 'N/A';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return name || user.username;
};

const CaseDetailPage = () => {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const response = await casesService.getCase(caseId);
        setCaseData(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch case details');
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/cases"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            &larr; Back to Cases
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cases"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            &larr; Back to Cases
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {caseData.case_number || `#${caseData.id}`} — {caseData.title}
              </h1>
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                caseData.status
              )}`}
            >
              {caseData.status?.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Summary */}
        {caseData.summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{caseData.summary}</p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Severity</p>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(
                caseData.crime_severity
              )}`}
            >
              {getSeverityLabel(caseData.crime_severity)}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Origin</p>
            <p className="text-gray-900 font-semibold mt-1">
              {caseData.origin?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Location</p>
            <p className="text-gray-900 font-semibold mt-1">
              {caseData.crime_scene_location || 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Crime Scene Time</p>
            <p className="text-gray-900 font-semibold mt-1">
              {caseData.crime_scene_time
                ? new Date(caseData.crime_scene_time).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Created At</p>
            <p className="text-gray-900 font-semibold mt-1">
              {new Date(caseData.created_at).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Updated At</p>
            <p className="text-gray-900 font-semibold mt-1">
              {new Date(caseData.updated_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Created By & Approved By */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Created By</h2>
            {caseData.created_by ? (
              <div>
                <p className="text-gray-700 font-semibold">{formatUserName(caseData.created_by)}</p>
                <p className="text-sm text-gray-500">@{caseData.created_by.username}</p>
                {caseData.created_by.roles?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {caseData.created_by.roles.map((role, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">N/A</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Approved By</h2>
            {caseData.approved_by ? (
              <div>
                <p className="text-gray-700 font-semibold">{formatUserName(caseData.approved_by)}</p>
                <p className="text-sm text-gray-500">@{caseData.approved_by.username}</p>
              </div>
            ) : (
              <p className="text-gray-500">Not yet approved</p>
            )}
          </div>
        </div>

        {/* Lead Detective */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Lead Detective</h2>
          {caseData.lead_detective ? (
            <div>
              <p className="text-gray-700 font-semibold">{formatUserName(caseData.lead_detective)}</p>
              <p className="text-sm text-gray-500">@{caseData.lead_detective.username}</p>
              {caseData.lead_detective.roles?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {caseData.lead_detective.roles.map((role, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No lead detective assigned</p>
          )}
        </div>

        {/* Officers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Officers</h2>
          {caseData.officers?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseData.officers.map((officer, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <p className="text-gray-700 font-semibold">{formatUserName(officer)}</p>
                  <p className="text-sm text-gray-500">@{officer.username}</p>
                  {officer.roles?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {officer.roles.map((role, j) => (
                        <span
                          key={j}
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No officers assigned</p>
          )}
        </div>

        {/* Origin Complaint */}
        {caseData.origin_complaint && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Origin Complaint</h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-gray-700">
                <span className="font-semibold">ID:</span> #{caseData.origin_complaint.id}
              </p>
              {caseData.origin_complaint.title && (
                <p className="text-gray-700 mt-1">
                  <span className="font-semibold">Title:</span> {caseData.origin_complaint.title}
                </p>
              )}
              {caseData.origin_complaint.description && (
                <p className="text-gray-700 mt-1">
                  <span className="font-semibold">Description:</span> {caseData.origin_complaint.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Witnesses */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Witnesses</h2>
          {caseData.witnesses?.length > 0 ? (
            <div className="space-y-3">
              {caseData.witnesses.map((witness, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Witness #{i + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Full Name</p>
                      <p className="text-gray-700">{witness.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Phone</p>
                      <p className="text-gray-700">{witness.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">National ID</p>
                      <p className="text-gray-700">{witness.national_id || 'N/A'}</p>
                    </div>
                  </div>
                  {witness.notes && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500">Notes</p>
                      <p className="text-gray-700">{witness.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No witnesses recorded</p>
          )}
        </div>

        {/* History Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">History</h2>
          {caseData.history?.length > 0 ? (
            <div className="space-y-4">
              {caseData.history.map((entry, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  </div>
                  <div className="flex-1 border-b border-gray-100 pb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(
                          entry.from_status
                        )}`}
                      >
                        {entry.from_status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(
                          entry.to_status
                        )}`}
                      >
                        {entry.to_status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      by <span className="font-semibold text-gray-700">{formatUserName(entry.changed_by) || 'System'}</span>
                      {' · '}
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No history entries</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;
