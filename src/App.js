import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

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

  // 1. New State for Monthly Filtering
  // Initialize with current month and year (YYYY-MM format)
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
        // Update entries state and ensure the new entry's month matches the filter
        setEntries([newEntry, ...entries]);
        resetForm();
        setError('');
        // Automatically set the filter to the month of the new entry if it's different
        const newEntryMonth = newEntry.date.substring(0, 7); // Assuming date is YYYY-MM-DD
        if (newEntryMonth !== selectedMonth) {
            setSelectedMonth(newEntryMonth);
        }
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


  // 2. Filter Entries by Selected Month
  const filteredEntries = useMemo(() => {
    if (!selectedMonth) return entries;
    
    return entries.filter(entry => {
      // Assuming entry.date is in YYYY-MM-DD format
      return entry.date && entry.date.startsWith(selectedMonth);
    });
  }, [entries, selectedMonth]);


  // 3. Calculate Total Expenses for Filtered Entries
  const totalMonthlyExpenses = useMemo(() => {
    return filteredEntries.reduce((total, entry) => {
      // Ensure the expense is a number before adding
      const expenseValue = parseFloat(entry.expense);
      return total + (isNaN(expenseValue) ? 0 : expenseValue);
    }, 0).toFixed(2); // Keep two decimal places for currency
  }, [filteredEntries]);


  return (
    <div className="App">
      <div className="container">
        
        <div className="header-content">
          <h1>🕌 Daily Tracker</h1>
          
          <div className="expense-summary-group">
            {/* Monthly Filter Selector */}
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-filter-input"
            />

            {/* Total Monthly Expenses Display */}
            <div className="total-expenses">
              💰 Monthly Expense: **{totalMonthlyExpenses} Taka**
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={editingId ? handleUpdate : handleCreate} className="form">
          {/* Form inputs use the browser's default time format, which is fine */}
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
            placeholder="Expense"
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
          // Use filteredEntries here
          <div className="entries-list">
            {filteredEntries.length === 0 ? (
              <p className="no-items">No entries found for {selectedMonth}.</p>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry._id} className="item-card">
                  <h3>{entry.date}</h3>
                  <p>
                    🌅 Rise: **{formatTime12Hour(entry.rise)}** | 
                    🌙 Sleep: **{formatTime12Hour(entry.sleep)}**
                  </p>
                  <p>
                    🕌 Salat: {Object.keys(entry.salat).filter(s => entry.salat[s]).join(', ') || 'None'}
                  </p>
                  <p>📖 Quran: {entry.quran} pages</p>
                  <p>💰 Expense: {entry.expense} Taka</p>
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