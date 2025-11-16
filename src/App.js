import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Utility function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24h) => {
  if (!time24h || typeof time24h !== 'string') return '';
  const [hours, minutes] = time24h.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24h;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minutesPadded = String(minutes).padStart(2, '0');
  return `${hour12}:${minutesPadded} ${ampm}`;
};

// Calculate sleep duration in hours
const calculateSleepDuration = (sleep, rise) => {
  if (!sleep || !rise) return 0;
  const [sleepH, sleepM] = sleep.split(':').map(Number);
  const [riseH, riseM] = rise.split(':').map(Number);
  let sleepMinutes = sleepH * 60 + sleepM;
  let riseMinutes = riseH * 60 + riseM;
  if (riseMinutes <= sleepMinutes) riseMinutes += 24 * 60;
  return ((riseMinutes - sleepMinutes) / 60).toFixed(1);
};

// Error Modal Component
const ErrorModal = ({ message, onClose }) => {
  const isVisible = !!message;
  if (!message) return null;

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

// Dashboard Page Component
const Dashboard = ({ entries, selectedMonth }) => {
  const monthEntries = useMemo(() => {
    return entries.filter(entry => entry.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  const stats = useMemo(() => {
    const totalEntries = monthEntries.length;
    const totalExpenses = monthEntries.reduce((sum, e) => sum + (parseFloat(e.expense) || 0), 0);
    const totalQuran = monthEntries.reduce((sum, e) => sum + (parseInt(e.quran) || 0), 0);
    
    // Get the current month and year from selectedMonth
    const [year, month] = selectedMonth.split('-').map(Number);
    // Get the number of days in the selected month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let totalSalatCount = 0;
    // Possible salat count should be 5 prayers * total days in month
    let possibleSalatCount = daysInMonth * 5;
    
    monthEntries.forEach(entry => {
      totalSalatCount += Object.values(entry.salat).filter(Boolean).length;
    });
    
    const avgSleep = monthEntries.length > 0 
      ? monthEntries.reduce((sum, e) => sum + parseFloat(calculateSleepDuration(e.sleep, e.rise)), 0) / totalEntries
      : 0;
    
    const salatPercentage = possibleSalatCount > 0 ? (totalSalatCount / possibleSalatCount * 100).toFixed(1) : 0;
    
    return {
      totalEntries,
      totalExpenses: totalExpenses.toFixed(2),
      totalQuran,
      avgSleep: avgSleep.toFixed(1),
      salatPercentage,
      totalSalatCount,
      possibleSalatCount
    };
  }, [monthEntries, selectedMonth]);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'var(--text-dark)' }}>📊 Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '12px', color: 'white', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Total Entries</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalEntries}</p>
          <p style={{ fontSize: '2rem', opacity: 0.8, marginTop: '8px' }}>📅</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', padding: '20px', borderRadius: '12px', color: 'white', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Salat Rate</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.salatPercentage}%</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>{stats.totalSalatCount}/{stats.possibleSalatCount} prayers</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', padding: '20px', borderRadius: '12px', color: 'white', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Quran Pages</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalQuran}</p>
          <p style={{ fontSize: '2rem', opacity: 0.8, marginTop: '8px' }}>📖</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '20px', borderRadius: '12px', color: 'white', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Avg Sleep</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.avgSleep}h</p>
          <p style={{ fontSize: '2rem', opacity: 0.8, marginTop: '8px' }}>😴</p>
        </div>
      </div>

      {/* Expense Summary */}
      <div className="item-card" style={{ borderLeftColor: '#dc3545', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>💰 Monthly Expenses</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{stats.totalExpenses} Taka</p>
      </div>

      {/* Recent Activity */}
      <div className="item-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📅 Recent Entries</h3>
        {monthEntries.length === 0 ? (
          <p className="no-items">No entries yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {monthEntries.slice(0, 5).map(entry => (
              <div key={entry._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--background-light)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {new Date(entry.date).getDate()}
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>{entry.date}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                      {Object.values(entry.salat).filter(Boolean).length}/5 Salat
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{entry.quran} pages</p>
                  <p style={{ fontSize: '0.8rem', color: '#dc3545' }}>{entry.expense} Taka</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Entries Page Component
const EntriesPage = ({ 
  entries, 
  formData, 
  setFormData, 
  editingId, 
  setEditingId,
  handleCreate, 
  handleUpdate,
  selectedMonth,
  totalMonthlyExpenses 
}) => {
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => entry.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSalatChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      salat: { ...prev.salat, [name]: checked }
    }));
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: '',
      rise: '',
      sleep: '',
      salat: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      quran: '',
      expense: '',
      badwork: ''
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'var(--text-dark)' }}>📝 Daily Entries</h2>
      
      {/* Form */}
      <div className="form">
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
            <label key={prayer} className="salat-checkbox-label">
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
          placeholder="Expense (Taka)"
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
          <button 
            onClick={editingId ? handleUpdate : handleCreate} 
            className="btn-primary"
          >
            {editingId ? '✓ Update Entry' : '+ Create Entry'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div style={{ marginTop: '24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Entries for {selectedMonth}</h3>
        <div className="total-expenses">
          💰 Total: {totalMonthlyExpenses} Taka
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="no-items">No entries found for {selectedMonth}</p>
      ) : (
        <div className="entries-list">
          {filteredEntries.map(entry => (
            <div key={entry._id} className="item-card">
              <h3 className="card-date">{entry.date}</h3>
              <p className="card-detail">
                <span role="img" aria-label="rise">🌅</span> Rise: <strong>{formatTime12Hour(entry.rise)}</strong>
                <span className="separator">|</span>
                <span role="img" aria-label="sleep">🌙</span> Sleep: <strong>{formatTime12Hour(entry.sleep)}</strong>
                <span className="separator">|</span>
                <span role="img" aria-label="duration">😴</span> Duration: <strong>{calculateSleepDuration(entry.sleep, entry.rise)}h</strong>
              </p>
              <p className="card-detail">
                <span role="img" aria-label="salat">🕌</span> Salat: 
                {Object.keys(entry.salat).filter(s => entry.salat[s]).map(s => (
                  <span key={s} className="salat-tag">{s.toUpperCase()}</span>
                )) || 'None'}
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
          ))}
        </div>
      )}
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage, selectedMonth, setSelectedMonth, sidebarOpen, setSidebarOpen }) => {
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'entries', name: 'Entries', icon: '📝' },
  ];

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '260px',
          background: 'linear-gradient(180deg, var(--primary-color) 0%, #4a4a7e 100%)',
          color: 'white',
          padding: '24px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 1000,
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🕌 Daily Tracker</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              display: window.innerWidth < 1024 ? 'block' : 'none'
            }}
          >
            ×
          </button>
        </div>

        <nav style={{ marginBottom: '32px' }}>
          {navigation.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '8px',
                border: 'none',
                borderRadius: '8px',
                background: currentPage === item.id ? 'white' : 'transparent',
                color: currentPage === item.id ? 'var(--primary-color)' : 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600' }}>
            Filter Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: window.innerWidth < 1024 ? 'block' : 'none'
          }}
        />
      )}
    </>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    rise: '',
    sleep: '',
    salat: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    quran: '',
    expense: '',
    badwork: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  useEffect(() => {
    fetchEntries();
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    const isDuplicate = entries.some(entry => entry.date === formData.date);
    if (isDuplicate) {
      setModalError(`An entry for ${formData.date} already exists.`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const newEntry = await response.json();

      if (response.ok) {
        setEntries([newEntry, ...entries]);
        setFormData({
          date: '',
          rise: '',
          sleep: '',
          salat: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
          quran: '',
          expense: '',
          badwork: ''
        });
        setModalError('');
      } else {
        setModalError(newEntry.message || 'Failed to create entry.');
      }
    } catch (err) {
      setModalError('Network error occurred.');
      console.error(err);
    }
  };

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
        setFormData({
          date: '',
          rise: '',
          sleep: '',
          salat: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
          quran: '',
          expense: '',
          badwork: ''
        });
        setEditingId(null);
        setModalError('');
      } else {
        setModalError(updatedEntry.message || 'Failed to update entry.');
      }
    } catch (err) {
      setModalError('Network error occurred.');
      console.error(err);
    }
  };

  const totalMonthlyExpenses = useMemo(() => {
    return entries
      .filter(entry => entry.date.startsWith(selectedMonth))
      .reduce((total, entry) => total + (parseFloat(entry.expense) || 0), 0)
      .toFixed(2);
  }, [entries, selectedMonth]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--background-light)' }}>
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div style={{ 
        flex: 1, 
        marginLeft: window.innerWidth >= 1024 && sidebarOpen ? '260px' : '0',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <header style={{ 
          background: 'white', 
          padding: '16px 24px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: window.innerWidth >= 1024 ? 'none' : 'block'
            }}
          >
            ☰
          </button>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', textTransform: 'capitalize' }}>
            {currentPage}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div className="container">
            {loading ? (
              <div className="loading-message">
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
                Loading...
              </div>
            ) : (
              <>
                {currentPage === 'dashboard' && (
                  <Dashboard entries={entries} selectedMonth={selectedMonth} />
                )}
                {currentPage === 'entries' && (
                  <EntriesPage
                    entries={entries}
                    formData={formData}
                    setFormData={setFormData}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    handleCreate={handleCreate}
                    handleUpdate={handleUpdate}
                    selectedMonth={selectedMonth}
                    totalMonthlyExpenses={totalMonthlyExpenses}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <ErrorModal message={modalError} onClose={() => setModalError('')} />
    </div>
  );
}

export default App;