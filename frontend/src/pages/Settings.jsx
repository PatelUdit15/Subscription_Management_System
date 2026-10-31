import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import './Settings.css'

function Settings() {
  const [settings, setSettings] = useState({
    company_name: '',
    address: '',
    website: '',
    currency: 'USD',
    logo_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axiosInstance.get('/settings')
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await axiosInstance.post('/settings', settings)
      setSettings(response.data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-loading">
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-title">Company Settings</h1>
        <p className="settings-subtitle">Configure your company information and preferences</p>
      </div>

      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="company_name" className="form-label">
              Company Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={settings.company_name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency" className="form-label">
              Currency <span className="required">*</span>
            </label>
            <select
              id="currency"
              name="currency"
              value={settings.currency}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={settings.address || ''}
              onChange={handleChange}
              className="form-textarea"
              rows="3"
              placeholder="Enter company address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website" className="form-label">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={settings.website || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo_url" className="form-label">
              Logo URL
            </label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={settings.logo_url || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={fetchSettings}
            className="btn-secondary"
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
