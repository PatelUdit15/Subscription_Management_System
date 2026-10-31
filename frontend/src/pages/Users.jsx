import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Users() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'internal',
    password: '',
    is_active: true
  });

  // Password rules validation
  const validatePassword = (pwd) => {
    return {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
  };

  const pwdValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(pwdValidation).every(Boolean);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.detail || 'Failed to load staff & users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'internal',
      password: '',
      is_active: true
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      is_active: user.is_active
    });
    setError(null);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not satisfy Brightloop security policy.');
      return;
    }

    try {
      setError(null);
      await axios.post('/users', formData);
      setSuccess(`Staff member ${formData.name} created successfully.`);
      setShowAddModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (formData.password && !isPasswordValid) {
      setError('New password does not satisfy Brightloop security policy.');
      return;
    }

    try {
      setError(null);
      const payload = {
        name: formData.name,
        role: formData.role,
        is_active: formData.is_active
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      await axios.put(`/users/${selectedUser.id}`, payload);
      setSuccess(`User ${formData.name} updated successfully.`);
      setShowEditModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user.');
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove staff member "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      await axios.delete(`/users/${user.id}`);
      setSuccess(`User ${user.name} removed successfully.`);
      fetchUsers();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary-dark)', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Staff & User Management
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Control staff access and user accounts. Only Admins can add or configure staff members.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
            color: '#fff',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(135, 90, 123, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>＋</span> Add Staff Member
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '0.75rem 1rem', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '240px',
            padding: '0.65rem 1rem',
            border: '1.5px solid rgba(135, 90, 123, 0.2)',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '0.9rem',
            background: '#fff'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(135, 90, 123, 0.2)'}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            border: '1.5px solid rgba(135, 90, 123, 0.2)',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '0.9rem',
            background: '#fff',
            color: 'var(--color-text-primary)'
          }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="internal">Internal Staff</option>
          <option value="portal">Customer Portal</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        border: '1px solid rgba(135, 90, 123, 0.15)',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(135, 90, 123, 0.06)'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading staff and users...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No users found matching your criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                color: 'white',
                fontWeight: '600'
              }}>
                <th style={{ padding: '0.9rem 1.25rem' }}>Name</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Email</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Role</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const roleColors = {
                  admin: { bg: 'var(--color-accent-light)', color: 'var(--color-primary-dark)' },
                  internal: { bg: '#e0f2fe', color: '#0369a1' },
                  portal: { bg: '#fef3c7', color: '#b45309' }
                };
                const style = roleColors[u.role] || { bg: '#f4f4f5', color: '#52525b' };

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(135, 90, 123, 0.08)' }}>
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      {u.name} {isCurrent && <span style={{ color: 'var(--color-primary)', fontWeight: 'normal' }}>(You)</span>}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: style.bg,
                          color: style.color,
                          textTransform: 'capitalize'
                        }}
                      >
                        {u.role === 'internal' ? 'Internal Staff' : u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: u.is_active ? '#22c55e' : '#9ca3af',
                          marginRight: '0.5rem'
                        }}
                      />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          fontWeight: '600',
                          marginRight: '1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        Edit
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={() => handleDelete(u)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(46, 46, 46, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(135, 90, 123, 0.2)',
              border: '1px solid rgba(135, 90, 123, 0.15)'
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)' }}>
              Add New Staff Member
            </h2>

            <form onSubmit={handleAddSubmit} style={{ padding: 0 }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                >
                  <option value="internal">Internal Staff (Limited day-to-day work)</option>
                  <option value="admin">Admin (Full system control)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter strong password"
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
                {/* Brightloop Password rules */}
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', background: 'var(--color-bg-soft)', padding: '0.6rem', borderRadius: '8px' }}>
                  <div style={{ color: pwdValidation.length ? '#15803d' : '#a1a1aa' }}>
                    {pwdValidation.length ? '✓' : '○'} At least 8 characters
                  </div>
                  <div style={{ color: pwdValidation.upper ? '#15803d' : '#a1a1aa' }}>
                    {pwdValidation.upper ? '✓' : '○'} At least one uppercase letter (A-Z)
                  </div>
                  <div style={{ color: pwdValidation.lower ? '#15803d' : '#a1a1aa' }}>
                    {pwdValidation.lower ? '✓' : '○'} At least one lowercase letter (a-z)
                  </div>
                  <div style={{ color: pwdValidation.special ? '#15803d' : '#a1a1aa' }}>
                    {pwdValidation.special ? '✓' : '○'} At least one special character (!@#$%^&*...)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: '#fff',
                    border: '1.5px solid rgba(135, 90, 123, 0.3)',
                    color: 'var(--color-primary-dark)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isPasswordValid}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: isPasswordValid ? 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)' : '#a1a1aa',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isPasswordValid ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    boxShadow: isPasswordValid ? '0 4px 12px rgba(135, 90, 123, 0.25)' : 'none'
                  }}
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(46, 46, 46, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(135, 90, 123, 0.2)',
              border: '1px solid rgba(135, 90, 123, 0.15)'
            }}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)' }}>
              Edit User: {selectedUser.name}
            </h2>

            <form onSubmit={handleEditSubmit} style={{ padding: 0 }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                >
                  <option value="admin">Admin</option>
                  <option value="internal">Internal Staff</option>
                  <option value="portal">Customer Portal</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active Account
                </label>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: 'var(--color-primary-dark)' }}>
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password if changing"
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
                {formData.password && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', background: 'var(--color-bg-soft)', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ color: pwdValidation.length ? '#15803d' : '#a1a1aa' }}>
                      {pwdValidation.length ? '✓' : '○'} At least 8 characters
                    </div>
                    <div style={{ color: pwdValidation.upper ? '#15803d' : '#a1a1aa' }}>
                      {pwdValidation.upper ? '✓' : '○'} Uppercase letter (A-Z)
                    </div>
                    <div style={{ color: pwdValidation.lower ? '#15803d' : '#a1a1aa' }}>
                      {pwdValidation.lower ? '✓' : '○'} Lowercase letter (a-z)
                    </div>
                    <div style={{ color: pwdValidation.special ? '#15803d' : '#a1a1aa' }}>
                      {pwdValidation.special ? '✓' : '○'} Special character (!@#$%^&*...)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: '#fff',
                    border: '1.5px solid rgba(135, 90, 123, 0.3)',
                    color: 'var(--color-primary-dark)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.password ? !isPasswordValid : false}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(135, 90, 123, 0.25)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
