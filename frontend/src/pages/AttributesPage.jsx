import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import './TaxesPage.css'

function AttributesPage() {
  const [attributes, setAttributes] = useState([])
  const [attributeValues, setAttributeValues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAttrModal, setShowAttrModal] = useState(false)
  const [showValueModal, setShowValueModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const [attrForm, setAttrForm] = useState({ name: '', is_active: true })
  const [valueForm, setValueForm] = useState({ attribute_id: '', value: '', is_active: true })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [attrsRes, valsRes] = await Promise.all([
        axiosInstance.get('/attributes'),
        axiosInstance.get('/attribute-values')
      ])
      setAttributes(attrsRes.data)
      setAttributeValues(valsRes.data)
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleCreateAttribute = async (e) => {
    e.preventDefault()
    if (!attrForm.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    try {
      await axiosInstance.post('/attributes', attrForm)
      showToast('Attribute created successfully!')
      fetchData()
      setShowAttrModal(false)
      setAttrForm({ name: '', is_active: true })
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create attribute', 'error')
    }
  }

  const handleCreateValue = async (e) => {
    e.preventDefault()
    if (!valueForm.attribute_id || !valueForm.value.trim()) {
      setErrors({ value: 'All fields are required' })
      return
    }

    try {
      await axiosInstance.post('/attribute-values', {
        ...valueForm,
        attribute_id: parseInt(valueForm.attribute_id)
      })
      showToast('Attribute value created successfully!')
      fetchData()
      setShowValueModal(false)
      setValueForm({ attribute_id: '', value: '', is_active: true })
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create value', 'error')
    }
  }

  const handleDeleteAttribute = async (id) => {
    if (!window.confirm('Delete this attribute and all its values?')) return
    try {
      await axiosInstance.delete(`/api/attributes/${id}`)
      showToast('Attribute deleted!')
      fetchData()
    } catch (error) {
      showToast('Failed to delete', 'error')
    }
  }

  const handleDeleteValue = async (id) => {
    if (!window.confirm('Delete this value?')) return
    try {
      await axiosInstance.delete(`/api/attribute-values/${id}`)
      showToast('Value deleted!')
      fetchData()
    } catch (error) {
      showToast('Failed to delete', 'error')
    }
  }

  const getAttributeName = (attrId) => {
    const attr = attributes.find(a => a.id === attrId)
    return attr ? attr.name : 'Unknown'
  }

  if (loading) return <div className="loading">Loading attributes...</div>

  return (
    <div className="taxes-page">
      {toast.show && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Attributes Management</h1>
          <p className="page-subtitle">Define product attributes and their values for variants</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setShowAttrModal(true)}>
            + New Attribute
          </button>
          <button className="btn-primary" onClick={() => setShowValueModal(true)}>
            + New Value
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Attributes Table */}
        <div className="table-container">
          <h3 style={{ padding: '1rem 1.5rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)' }}>
            Attributes
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.length === 0 ? (
                <tr><td colSpan="2" className="empty-state">No attributes found</td></tr>
              ) : (
                attributes.map(attr => (
                  <tr key={attr.id}>
                    <td className="font-medium">{attr.name}</td>
                    <td>
                      <button className="btn-icon btn-delete" onClick={() => handleDeleteAttribute(attr.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Attribute Values Table */}
        <div className="table-container">
          <h3 style={{ padding: '1rem 1.5rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)' }}>
            Attribute Values
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributeValues.length === 0 ? (
                <tr><td colSpan="3" className="empty-state">No values found</td></tr>
              ) : (
                attributeValues.map(val => (
                  <tr key={val.id}>
                    <td><span className="badge badge-type">{getAttributeName(val.attribute_id)}</span></td>
                    <td className="font-medium">{val.value}</td>
                    <td>
                      <button className="btn-icon btn-delete" onClick={() => handleDeleteValue(val.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attribute Modal */}
      {showAttrModal && (
        <div className="modal-overlay" onClick={() => setShowAttrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Attribute</h2>
              <button className="modal-close" onClick={() => setShowAttrModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAttribute}>
              <div className="form-group">
                <label>Attribute Name *</label>
                <input
                  type="text"
                  value={attrForm.name}
                  onChange={e => setAttrForm({ ...attrForm, name: e.target.value })}
                  placeholder="e.g., Color, Size, Brand"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAttrModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Value Modal */}
      {showValueModal && (
        <div className="modal-overlay" onClick={() => setShowValueModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Attribute Value</h2>
              <button className="modal-close" onClick={() => setShowValueModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateValue}>
              <div className="form-group">
                <label>Attribute *</label>
                <select
                  value={valueForm.attribute_id}
                  onChange={e => setValueForm({ ...valueForm, attribute_id: e.target.value })}
                  className={errors.value ? 'error' : ''}
                >
                  <option value="">-- Select Attribute --</option>
                  {attributes.map(attr => (
                    <option key={attr.id} value={attr.id}>{attr.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Value *</label>
                <input
                  type="text"
                  value={valueForm.value}
                  onChange={e => setValueForm({ ...valueForm, value: e.target.value })}
                  placeholder="e.g., Red, Large, Nike"
                  className={errors.value ? 'error' : ''}
                />
                {errors.value && <span className="error-message">{errors.value}</span>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowValueModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttributesPage
