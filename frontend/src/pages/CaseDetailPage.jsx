import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import casesService from '../services/casesService';
import suspectService from '../services/suspectService';

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
    pending_chief: 'bg-rose-100 text-rose-800',
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
  const { user } = useSelector((state) => state.auth);
  const userRoles = (user?.roles || user?.groups || []).map(r => r.toLowerCase());
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [suspects, setSuspects] = useState([]);
  const [showAddSuspect, setShowAddSuspect] = useState(false);
  const [suspectForm, setSuspectForm] = useState({ full_name: '', description: '', aliases: '', last_known_location: '' });

  const canApproveCase = user?.is_staff || ['sergeant', 'captain', 'chief'].some(r => userRoles.includes(r));
  const isDetective = userRoles.includes('detective');
  const isSergeant = userRoles.includes('sergeant');
  const isCaptain = userRoles.includes('captain');
  const isChief = userRoles.includes('chief');
  const [guiltScores, setGuiltScores] = useState({});

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

  const fetchSuspects = async () => {
    try {
      const response = await casesService.getCaseSuspects(caseId);
      setSuspects(response.data || []);
    } catch (err) {
      // Suspects might not exist yet
    }
  };

  useEffect(() => {
    fetchCase();
    fetchSuspects();
  }, [caseId]);

  const handleApproveCase = async () => {
    try {
      setActionLoading(true);
      await casesService.approveCase(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve case');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartInvestigation = async () => {
    try {
      setActionLoading(true);
      await casesService.startInvestigation(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start investigation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSuspects = async () => {
    try {
      setActionLoading(true);
      await casesService.approveSuspects(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve suspects');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSuspect = async () => {
    if (!suspectForm.full_name.trim()) return;
    try {
      setActionLoading(true);
      await casesService.addSuspect(caseId, suspectForm);
      setSuspectForm({ full_name: '', description: '', aliases: '', last_known_location: '' });
      setShowAddSuspect(false);
      await fetchSuspects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add suspect');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIdentifySuspects = async () => {
    try {
      setActionLoading(true);
      await casesService.identifySuspects(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit suspects to sergeant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSuspects = async () => {
    try {
      setActionLoading(true);
      await casesService.rejectSuspects(caseId, { notes: rejectNotes });
      setShowRejectForm(false);
      setRejectNotes('');
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject suspects');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitGuiltScore = async (suspectId, role) => {
    const score = guiltScores[`${role}_${suspectId}`];
    if (!score || score < 1 || score > 10) return;
    try {
      setActionLoading(true);
      if (role === 'detective') {
        await suspectService.submitDetectiveScore(suspectId, { score: parseInt(score) });
      } else {
        await suspectService.submitSergeantScore(suspectId, { score: parseInt(score) });
      }
      await fetchSuspects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit score');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitToCaptain = async () => {
    try {
      setActionLoading(true);
      await casesService.submitToCaptain(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit to captain');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCaptainApprove = async () => {
    try {
      setActionLoading(true);
      await casesService.captainApprove(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChiefApprove = async () => {
    try {
      setActionLoading(true);
      await casesService.chiefApprove(caseId);
      await fetchCase();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

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

        {/* Action Buttons */}
        {caseData.status === 'pending_approval' && canApproveCase && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-3">Pending Approval</h2>
            <p className="text-yellow-700 mb-4">This case requires superior approval to proceed.</p>
            <button
              onClick={handleApproveCase}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Approving...' : 'Approve Case'}
            </button>
          </div>
        )}

        {caseData.status === 'created' && isDetective && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">Case Ready for Investigation</h2>
            <p className="text-blue-700 mb-4">This case is approved and ready for detective investigation.</p>
            <button
              onClick={handleStartInvestigation}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Starting...' : 'Start Investigation'}
            </button>
          </div>
        )}

        {caseData.status === 'investigation' && isDetective && (
          <div className="bg-purple-50 border border-purple-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-800 mb-3">Under Investigation</h2>
            <p className="text-purple-700 mb-4">Use the Detective Board to manage evidence and identify suspects.</p>
            <Link
              to={`/detective-board/${caseId}`}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-semibold transition inline-block"
            >
              Open Detective Board
            </Link>
          </div>
        )}

        {/* Suspects Section - for detective during investigation */}
        {caseData.status === 'investigation' && isDetective && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Case Suspects</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddSuspect(!showAddSuspect)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition"
                >
                  + Add Suspect
                </button>
                {suspects.length > 0 && (
                  <button
                    onClick={handleIdentifySuspects}
                    disabled={actionLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Sending...' : 'Submit Suspects to Sergeant'}
                  </button>
                )}
              </div>
            </div>

            {showAddSuspect && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={suspectForm.full_name}
                      onChange={(e) => setSuspectForm({ ...suspectForm, full_name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Suspect full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aliases</label>
                    <input
                      type="text"
                      value={suspectForm.aliases}
                      onChange={(e) => setSuspectForm({ ...suspectForm, aliases: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Known aliases"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Known Location</label>
                    <input
                      type="text"
                      value={suspectForm.last_known_location}
                      onChange={(e) => setSuspectForm({ ...suspectForm, last_known_location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Last known location"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={suspectForm.description}
                      onChange={(e) => setSuspectForm({ ...suspectForm, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows="2"
                      placeholder="Description"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSuspect}
                  disabled={actionLoading || !suspectForm.full_name.trim()}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Suspect'}
                </button>
              </div>
            )}

            {suspects.length > 0 ? (
              <div className="space-y-3">
                {suspects.map((link) => (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{link.suspect_detail?.full_name || `Suspect #${link.suspect}`}</p>
                        {link.suspect_detail?.aliases && (
                          <p className="text-sm text-gray-600">Aliases: {link.suspect_detail.aliases}</p>
                        )}
                        {link.suspect_detail?.description && (
                          <p className="text-sm text-gray-600 mt-1">{link.suspect_detail.description}</p>
                        )}
                      </div>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        {link.role?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    {link.notes && <p className="text-sm text-gray-500 mt-2">{link.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No suspects added yet.</p>
            )}
          </div>
        )}

        {/* Suspects display for sergeant on suspect_identified cases */}
        {caseData.status === 'suspect_identified' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Identified Suspects</h2>
            {suspects.length > 0 ? (
              <div className="space-y-3">
                {suspects.map((link) => (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{link.suspect_detail?.full_name || `Suspect #${link.suspect}`}</p>
                        {link.suspect_detail?.aliases && (
                          <p className="text-sm text-gray-600">Aliases: {link.suspect_detail.aliases}</p>
                        )}
                        {link.suspect_detail?.description && (
                          <p className="text-sm text-gray-600 mt-1">{link.suspect_detail.description}</p>
                        )}
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        link.suspect_detail?.status === 'arrested' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {link.suspect_detail?.status?.replace(/_/g, ' ').toUpperCase() || link.role?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No suspects identified.</p>
            )}
          </div>
        )}

        {caseData.status === 'suspect_identified' && isSergeant && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-orange-800 mb-3">Suspects Identified – Awaiting Sergeant Approval</h2>
            <p className="text-orange-700 mb-4">Review the evidence and suspects, then approve or reject.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleApproveSuspects}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Approve – Authorize Arrest'}
              </button>
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            {showRejectForm && (
              <div className="mt-4">
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  rows="3"
                />
                <button
                  onClick={handleRejectSuspects}
                  disabled={actionLoading || !rejectNotes.trim()}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Interrogation Phase - Detective & Sergeant submit guilt scores */}
        {caseData.status === 'interrogation' && (isDetective || isSergeant) && (
          <div className="bg-red-50 border border-red-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-3">Interrogation Phase</h2>
            <p className="text-red-700 mb-4">
              Submit guilt probability scores (1-10) for each suspect.
            </p>
            {suspects.length > 0 ? (
              <div className="space-y-4">
                {suspects.map((link) => {
                  const suspectId = link.suspect_detail?.id || link.suspect;
                  const role = isDetective ? 'detective' : 'sergeant';
                  const scoreKey = `${role}_${suspectId}`;
                  const existingScore = isDetective
                    ? link.suspect_detail?.detective_guilt_score
                    : link.suspect_detail?.sergeant_guilt_score;
                  return (
                    <div key={link.id} className="border border-red-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{link.suspect_detail?.full_name}</p>
                          <p className="text-sm text-gray-500">
                            Detective score: {link.suspect_detail?.detective_guilt_score ?? '—'} | 
                            Sergeant score: {link.suspect_detail?.sergeant_guilt_score ?? '—'}
                          </p>
                        </div>
                        {existingScore ? (
                          <span className="text-green-700 font-semibold text-sm">Score submitted: {existingScore}/10</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={guiltScores[scoreKey] || ''}
                              onChange={(e) => setGuiltScores({ ...guiltScores, [scoreKey]: e.target.value })}
                              className="w-20 p-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="1-10"
                            />
                            <button
                              onClick={() => handleSubmitGuiltScore(suspectId, role)}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                            >
                              Submit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No suspects in interrogation.</p>
            )}
            {/* Submit to Captain button - visible when all scores are in */}
            {(isDetective || isSergeant) && suspects.length > 0 && suspects.every(
              (link) => link.suspect_detail?.detective_guilt_score && link.suspect_detail?.sergeant_guilt_score
            ) && (
              <button
                onClick={handleSubmitToCaptain}
                disabled={actionLoading}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? 'Submitting...' : 'Submit to Captain for Decision'}
              </button>
            )}
          </div>
        )}

        {/* Pending Captain Decision */}
        {caseData.status === 'pending_captain' && isCaptain && (
          <div className="bg-indigo-50 border border-indigo-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-indigo-800 mb-3">Pending Captain Decision</h2>
            <p className="text-indigo-700 mb-4">
              Review guilt scores, evidence, and testimonies. Then approve to proceed.
            </p>
            {suspects.length > 0 && (
              <div className="space-y-3 mb-4">
                {suspects.map((link) => (
                  <div key={link.id} className="border border-indigo-200 rounded-lg p-4 bg-white">
                    <p className="font-semibold text-gray-900">{link.suspect_detail?.full_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Detective score: <span className="font-bold">{link.suspect_detail?.detective_guilt_score ?? '—'}/10</span> | 
                      Sergeant score: <span className="font-bold">{link.suspect_detail?.sergeant_guilt_score ?? '—'}/10</span>
                    </p>
                    {link.suspect_detail?.captain_decision && (
                      <p className="text-sm text-green-700 mt-1">Decision: {link.suspect_detail.captain_decision}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleCaptainApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : caseData.crime_severity === 0 ? 'Approve – Escalate to Chief' : 'Approve – Send to Trial'}
            </button>
          </div>
        )}

        {/* Pending Chief Decision (Critical cases) */}
        {caseData.status === 'pending_chief' && isChief && (
          <div className="bg-rose-50 border border-rose-300 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-rose-800 mb-3">Pending Chief Decision (Critical Case)</h2>
            <p className="text-rose-700 mb-4">
              This is a critical-level case. Review captain's decision and approve to send to trial.
            </p>
            {suspects.length > 0 && (
              <div className="space-y-3 mb-4">
                {suspects.map((link) => (
                  <div key={link.id} className="border border-rose-200 rounded-lg p-4 bg-white">
                    <p className="font-semibold text-gray-900">{link.suspect_detail?.full_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Detective: {link.suspect_detail?.detective_guilt_score ?? '—'}/10 | 
                      Sergeant: {link.suspect_detail?.sergeant_guilt_score ?? '—'}/10
                    </p>
                    {link.suspect_detail?.captain_decision && (
                      <p className="text-sm text-indigo-700 mt-1">Captain: {link.suspect_detail.captain_decision}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleChiefApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Approve – Send to Trial'}
            </button>
          </div>
        )}

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
