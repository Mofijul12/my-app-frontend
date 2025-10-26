// This code is the same as the last working version, no changes needed here
// but included for completeness.

import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// ... (formatTime12Hour and ErrorModal components remain here) ...

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Utility function to convert 24-hour time string (HH:MM) to 12-hour format (H:MM AM/PM)
const formatTime12Hour = (time24h) => {
  if (!time24h || typeof time24h !== 'string') return '';
  
  const [hours, minutes] = time24h.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24h;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12
  
  const minutesPadded = String(minutes).padStart(2, '0');
  
  return `${hour12}:${minutesPadded} ${ampm}`;
};

// Error Modal Component
const ErrorModal = ({ message, onClose }) => {
  const isVisible = !!message;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ opacity: isVisible ? 1 : 0, visibility: isVisible ? 'visible' : 'hidden' }}
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚫 Error</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};


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
  const [modalError, setModalError] = useState('');

  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);


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
      setModalError(''); 
    } catch (err) {
      setModalError('Failed to fetch daily entries from server.');
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
    
    // 🛑 Daily Duplicate Check 🛑
    const isDuplicate = entries.some(
        (entry) => entry.date === formData.date
    );

    if (isDuplicate) {
        setModalError(`An entry for ${formData.date} already exists. Please edit the existing entry or choose a different date.`);
        return; // Stop the creation process
    }
    // 🛑 END: Daily Duplicate Check 🛑
    
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
        setModalError(''); 
        const newEntryMonth = newEntry.date.substring(0, 7);
        if (newEntryMonth !== selectedMonth) {
            setSelectedMonth(newEntryMonth);
        }
      } else {
        setModalError(newEntry.message || 'Failed to create entry on server.');
      }
    } catch (err) {
      setModalError('A network error occurred while creating the entry.');
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
        setModalError(''); 
      } else {
        setModalError(updatedEntry.message || 'Failed to update entry on server.');
      }
    } catch (err) {
      setModalError('A network error occurred while updating the entry.');
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
        setModalError('');
      } else {
        setModalError('Failed to delete entry on server.');
      }
    } catch (err) {
      setModalError('A network error occurred while deleting the entry.');
      console.error(err);
    }
  };

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

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

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

  // 2. Filter Entries by Selected Month
  const filteredEntries = useMemo(() => {
    if (!selectedMonth) return entries;
    
    return entries.filter(entry => {
      return entry.date && entry.date.startsWith(selectedMonth);
    });
  }, [entries, selectedMonth]);


  // 3. Calculate Total Expenses for Filtered Entries
  const totalMonthlyExpenses = useMemo(() => {
    return filteredEntries.reduce((total, entry) => {
      const expenseValue = parseFloat(entry.expense);
      return total + (isNaN(expenseValue) ? 0 : expenseValue);
    }, 0).toFixed(2);
  }, [filteredEntries]);


  return (
    <div className="App">
      <div className="container">
        
        <div className="header-content">
          <h1>🕌 Daily Tracker</h1>
          
          <div className="expense-summary-group">
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-filter-input"
            />

            <div className="total-expenses">
              💰 Monthly Expense: **{totalMonthlyExpenses} Taka**
            </div>
          </div>
        </div>

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
              <label key={prayer} className="salat-checkbox-label"> {/* Added class for professional look */}
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
            placeholder="Expense (Taka)" // Added currency hint
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
          <p className="loading-message">Loading...</p>
        ) : (
          <div className="entries-list">
            {filteredEntries.length === 0 ? (
              <p className="no-items">No entries found for {selectedMonth}.</p>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry._id} className="item-card">
                  <h3 className="card-date">{entry.date}</h3>
                  <p className="card-detail">
                    <span role="img" aria-label="rise">🌅</span> Rise: <strong>{formatTime12Hour(entry.rise)}</strong>
                    <span className="separator">|</span>
                    <span role="img" aria-label="sleep">🌙</span> Sleep: <strong>{formatTime12Hour(entry.sleep)}</strong>
                  </p>
                  <p className="card-detail">
                    <span role="img" aria-label="salat">🕌</span> Salat: 
                    {Object.keys(entry.salat).filter(s => entry.salat[s]).map(s => <span key={s} className="salat-tag">{s.toUpperCase()}</span>) || 'None'}
                  </p>
                  <p className="card-detail">
                    <span role="img" aria-label="quran">📖</span> Quran: <strong>{entry.quran} pages</strong>
                  </p>
                  <p className="card-detail expense-line">
                    <span role="img" aria-label="expense">💰</span> Expense: <strong>{entry.expense} Taka</strong>
                  </p>
                  <p className="card-detail badwork-line">
                    <span role="img" aria-label="badwork">⚠️</span> Badwork: <span>{entry.badwork || 'None'}</span>
                  </p>
                  <small className="card-timestamp">Created: {new Date(entry.createdAt).toLocaleString()}</small>
                  <div className="item-actions">
                    <button onClick={() => startEdit(entry)} className="btn-edit">
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      <ErrorModal 
        message={modalError} 
        onClose={() => setModalError('')} 
      />
      
    </div>
  );
}

export default App;