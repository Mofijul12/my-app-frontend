import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all items
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/items`);
      const data = await response.json();
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create item
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const newItem = await response.json();
      setItems([newItem, ...items]);
      setFormData({ name: '', description: '' });
      setError('');
    } catch (err) {
      setError('Failed to create item');
      console.error(err);
    }
  };

  // Update item
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/items/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const updatedItem = await response.json();
      setItems(items.map(item => item._id === editingId ? updatedItem : item));
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE'
      });
      setItems(items.filter(item => item._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  // Start editing
  const startEdit = (item) => {
    setEditingId(item._id);
    setFormData({ name: item.name, description: item.description });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  return (
    <div className="App">
      <div className="container">
        <h1>CRUD Application</h1>
        
        {error && <div className="error">{error}</div>}

        <form onSubmit={editingId ? handleUpdate : handleCreate} className="form">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
          />
          <div className="button-group">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Create'}
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
          <div className="items-list">
            {items.length === 0 ? (
              <p className="no-items">No items yet. Create your first one!</p>
            ) : (
              items.map(item => (
                <div key={item._id} className="item-card">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <small>Created: {new Date(item.createdAt).toLocaleString()}</small>
                  <div className="item-actions">
                    <button onClick={() => startEdit(item)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="btn-delete">
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