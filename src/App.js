import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    rise: '',
    sleep: '',
    salat: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false
    },
    quran: '',
    expense: '',
    badwork: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all daily entries
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/daily`);
      const data = await response.json();
      setEntries(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch daily entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle salat checkbox change
  const handleSalatChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      salat: {
        ...prev.salat,
        [name]: checked
      }
    }));
  };

  // Create new daily entry
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const newEntry = await response.json();

      if (response.ok) {
        setEntries([newEntry, ...entries]);
        resetForm();
        setError('');
      } else {
        setError(newEntry.message || 'Failed to create entry');
      }
    } catch (err) {
      setError('Failed to create entry');
      console.error(err);
    }
  };

  // Update existing daily entry
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/daily/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const updatedEntry = await response.json();

      if (response.ok) {
        setEntries(entries.map(entry => entry._id === editingId ? updatedEntry : entry));
        resetForm();
        setEditingId(null);
        setError('');
      } else {
        setError(updatedEntry.message || 'Failed to update entry');
      }
    } catch (err) {
      setError('Failed to update entry');
      console.error(err);
    }
  };

  // Delete daily entry
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`${API_URL}/api/daily/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setEntries(entries.filter(entry => entry._id !== id));
        setError('');
      } else {
        setError('Failed to delete entry');
      }
    } catch (err) {
      setError('Failed to delete entry');
      console.error(err);
    }
  };

  // Start editing
  const startEdit = (entry) => {
    setEditingId(entry._id);
    setFormData({
      date: entry.date,
      rise: entry.rise,
      sleep: entry.sleep,
      salat: entry.salat,
      quran: entry.quran,
      expense: entry.expense,
      badwork: entry.badwork
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: '',
      rise: '',
      sleep: '',
      salat: {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
      },
      quran: '',
      expense: '',
      badwork: ''
    });
  };

  return (
    <div className="App">
      <div className="container">
        <h1>🕌 Daily Tracker</h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={editingId ? handleUpdate : handleCreate} className="form">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
          <input
            type="time"
            name="rise"
            placeholder="Rise time"
            value={formData.rise}
            onChange={handleChange}
            required
          />
          <input
            type="time"
            name="sleep"
            placeholder="Sleep time"
            value={formData.sleep}
            onChange={handleChange}
            required
          />

          <div className="salat-section">
            <label>Salat:</label>
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => (
              <label key={prayer}>
                <input
                  type="checkbox"
                  name={prayer}
                  checked={formData.salat[prayer]}
                  onChange={handleSalatChange}
                />
                {prayer.toUpperCase()}
              </label>
            ))}
          </div>

          <input
            type="number"
            name="quran"
            placeholder="Quran (pages)"
            value={formData.quran}
            onChange={handleChange}
          />
          <input
            type="number"
            name="expense"
            placeholder="Expense (₹)"
            value={formData.expense}
            onChange={handleChange}
          />
          <textarea
            name="badwork"
            placeholder="Bad habits / distractions"
            value={formData.badwork}
            onChange={handleChange}
          />

          <div className="button-group">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Entry' : 'Create Entry'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="entries-list">
            {entries.length === 0 ? (
              <p className="no-items">No entries yet. Start tracking your day!</p>
            ) : (
              entries.map(entry => (
                <div key={entry._id} className="item-card">
                  <h3>{entry.date}</h3>
                  <p>🌅 Rise: {entry.rise} | 🌙 Sleep: {entry.sleep}</p>
                  <p>
                    🕌 Salat: {Object.keys(entry.salat).filter(s => entry.salat[s]).join(', ') || 'None'}
                  </p>
                  <p>📖 Quran: {entry.quran} pages</p>
                  <p>💰 Expense: ₹{entry.expense}</p>
                  <p>⚠️ Badwork: {entry.badwork || 'None'}</p>
                  <small>Created: {new Date(entry.createdAt).toLocaleString()}</small>
                  <div className="item-actions">
                    <button onClick={() => startEdit(entry)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(entry._id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
