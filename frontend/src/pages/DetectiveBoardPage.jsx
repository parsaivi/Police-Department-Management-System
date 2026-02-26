import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import casesService from '../services/casesService';

const DetectiveBoardPage = () => {
  const { caseId } = useParams();
  const [board, setBoard] = useState({ notes: [], connections: [], evidence_items: [] });
  const [newNote, setNewNote] = useState('');
  const [newConnection, setNewConnection] = useState({ from: 0, to: 1, type: 'related' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const draggingRef = useRef(null);

  const handleNoteMouseDown = (e, noteId) => {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const note = board.notes.find((n) => n.id === noteId);
    if (!note) return;
    draggingRef.current = {
      noteId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNoteX: note.x || 0,
      startNoteY: note.y || 0,
    };
  };

  const handleMouseMove = (e) => {
    if (!draggingRef.current) return;
    const { noteId, startMouseX, startMouseY, startNoteX, startNoteY } = draggingRef.current;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    setBoard((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId ? { ...n, x: startNoteX + dx, y: startNoteY + dy } : n
      ),
    }));
  };

  const handleMouseUp = async () => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    try {
      await casesService.updateDetectiveBoard(caseId, board);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save note position');
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchBoard();
    }
  }, [caseId]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await casesService.getDetectiveBoard(caseId);
      setBoard(response.data || { notes: [], connections: [], evidence_items: [] });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch detective board');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const updatedBoard = {
        ...board,
        notes: [
          ...board.notes,
          {
            id: Date.now(),
            content: newNote,
            x: Math.random() * 400,
            y: Math.random() * 400,
          },
        ],
      };
      await casesService.updateDetectiveBoard(caseId, updatedBoard);
      setBoard(updatedBoard);
      setNewNote('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add note');
    }
  };

  const handleAddConnection = async () => {
    if (newConnection.from === newConnection.to) {
      setError('Cannot connect note to itself');
      return;
    }

    try {
      const updatedBoard = {
        ...board,
        connections: [
          ...board.connections,
          {
            id: Date.now(),
            from: parseInt(newConnection.from),
            to: parseInt(newConnection.to),
            type: newConnection.type,
          },
        ],
      };
      await casesService.updateDetectiveBoard(caseId, updatedBoard);
      setBoard(updatedBoard);
      setNewConnection({ from: 0, to: 1, type: 'related' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add connection');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const updatedBoard = {
        ...board,
        notes: board.notes.filter((note) => note.id !== noteId),
        connections: board.connections.filter(
          (conn) => conn.from !== noteId && conn.to !== noteId
        ),
      };
      await casesService.updateDetectiveBoard(caseId, updatedBoard);
      setBoard(updatedBoard);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete note');
    }
  };

  const handleDeleteConnection = async (connId) => {
    try {
      const updatedBoard = {
        ...board,
        connections: board.connections.filter((conn) => conn.id !== connId),
      };
      await casesService.updateDetectiveBoard(caseId, updatedBoard);
      setBoard(updatedBoard);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete connection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading detective board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Detective Board</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Add Note */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Note</h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Enter note content..."
                  rows="4"
                ></textarea>
                <button
                  onClick={handleAddNote}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  Add Note
                </button>
              </div>

              {/* Add Connection */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Connect Notes</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Note
                    </label>
                    <select
                      value={newConnection.from}
                      onChange={(e) =>
                        setNewConnection({ ...newConnection, from: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {board.notes.map((note, idx) => (
                        <option key={note.id} value={idx}>
                          Note {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Note
                    </label>
                    <select
                      value={newConnection.to}
                      onChange={(e) =>
                        setNewConnection({ ...newConnection, to: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {board.notes.map((note, idx) => (
                        <option key={note.id} value={idx}>
                          Note {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connection Type
                    </label>
                    <select
                      value={newConnection.type}
                      onChange={(e) =>
                        setNewConnection({ ...newConnection, type: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="related">Related</option>
                      <option value="suspect">Suspect</option>
                      <option value="evidence">Evidence</option>
                      <option value="location">Location</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddConnection}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Add Connection
                  </button>
                </div>
              </div>

              {/* Evidence Items from Case */}
              {board.evidence_items?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Case Evidence</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {board.evidence_items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-blue-50 border border-blue-200 p-3 rounded-lg"
                      >
                        <p className="text-sm font-semibold text-blue-900">{item.title}</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {item.evidence_type?.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.status?.toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            setNewNote(`[Evidence #${item.id}] ${item.title}: ${item.description || ''}`);
                          }}
                          className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-semibold block"
                        >
                          + Add to Board
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Connections */}
              {board.connections.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Connections</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {board.connections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex justify-between items-center bg-gray-100 p-2 rounded text-sm"
                      >
                        <span className="text-gray-700">
                          {conn.type.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleDeleteConnection(conn.id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Board Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div
                className="relative bg-gray-50 rounded-lg p-6 min-h-screen border-2 border-dashed border-gray-300"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Draw connections */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 0 }}
                >
                  {board.connections.map((conn) => {
                    const fromNote = board.notes[conn.from];
                    const toNote = board.notes[conn.to];
                    if (!fromNote || !toNote) return null;

                    const x1 = (fromNote.x || 0) + 60;
                    const y1 = (fromNote.y || 0) + 40;
                    const x2 = (toNote.x || 0) + 60;
                    const y2 = (toNote.y || 0) + 40;

                    return (
                      <line
                        key={conn.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="4"
                      />
                    );
                  })}
                </svg>

                {/* Notes */}
                <div className="relative z-10">
                  {board.notes.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <p className="text-lg">No notes yet. Add a note to get started.</p>
                    </div>
                  ) : (
                    board.notes.map((note, idx) => (
                      <div
                        key={note.id}
                        className="absolute bg-yellow-200 p-4 rounded-lg shadow-lg w-40 break-words cursor-grab active:cursor-grabbing select-none"
                        style={{
                          left: `${note.x || idx * 150}px`,
                          top: `${note.y || idx * 150}px`,
                        }}
                        onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {note.content.substring(0, 100)}
                          {note.content.length > 100 ? '...' : ''}
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="mt-2 text-red-600 hover:text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectiveBoardPage;
