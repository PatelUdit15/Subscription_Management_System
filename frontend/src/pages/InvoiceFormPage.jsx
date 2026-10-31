import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axios';

const InvoiceFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('order_lines');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    number: '',
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    total_amount: 0
  });

  const [orderLines, setOrderLines] = useState([
    { product_id: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }
  ]);

  useEffect(() => {
    fetchData();
    if (isEditMode) {
      fetchInvoice();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        axios.get('/customers'),
        axios.get('/products')
      ]);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await axios.get(`/invoices/${id}`);
      const invoice = response.data;
      setFormData({
        number: invoice.number || '',
        customer_id: invoice.customer_id || '',
        invoice_date: invoice.date_issued?.split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date?.split('T')[0] || '',
        status: invoice.status || 'draft',
        total_amount: invoice.total_amount || 0
      });
      
      if (invoice.lines && invoice.lines.length > 0) {
        setOrderLines(invoice.lines.map(line => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate || 0,
          amount: line.subtotal
        })));
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...orderLines];
    newLines[index][field] = field === 'product_id' ? value : (parseFloat(value) || 0);
    
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newLines[index].unit_price = product.base_price || 0;
      }
    }
    
    const line = newLines[index];
    const subtotal = line.quantity * line.unit_price;
    const taxAmount = subtotal * (line.tax_rate / 100);
    line.amount = subtotal + taxAmount;
    
    setOrderLines(newLines);
    calculateTotal(newLines);
  };

  const addLine = () => {
    setOrderLines([...orderLines, { product_id: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }]);
  };

  const removeLine = (index) => {
    if (orderLines.length > 1) {
      const newLines = orderLines.filter((_, i) => i !== index);
      setOrderLines(newLines);
      calculateTotal(newLines);
    }
  };

  const calculateTotal = (lines = orderLines) => {
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    setFormData(prev => ({ ...prev, total_amount: total }));
  };

  const handleSave = async () => {
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (orderLines.length === 0 || !orderLines[0].product_id) {
      alert('Please add at least one product');
      return;
    }

    try {
      setLoading(true);
      
      const customer = customers.find(c => c.id === parseInt(formData.customer_id));
      const payload = {
        customer_name: customer?.name || '',
        date_issued: formData.invoice_date,
        due_date: formData.due_date,
        total_amount: formData.total_amount,
        status: formData.status,
        notes: '',
        lines: orderLines.map(line => ({
          product_id: parseInt(line.product_id),
          description: products.find(p => p.id === parseInt(line.product_id))?.name || '',
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate
        }))
      };

      console.log('Saving invoice with payload:', payload);

      if (isEditMode) {
        await axios.put(`/invoices/${id}`, payload);
        alert('✓ Invoice saved successfully!');
        fetchInvoice();
      } else {
        const response = await axios.post('/invoices', payload);
        console.log('Invoice created:', response.data);
        alert('✓ Invoice created successfully!');
        navigate(`/admin/invoices/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to save invoice: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    if (!window.confirm('Delete this invoice?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/invoices/${id}`);
      alert('✓ Invoice deleted');
      navigate('/admin/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isEditMode) {
      alert('Please save the invoice first');
      return;
    }

    if (!window.confirm('Confirm this invoice?')) return;

    try {
      setLoading(true);
      const response = await axios.post(`/invoices/${id}/confirm`);
      setFormData(prev => ({
        ...prev,
        number: response.data.number,
        status: 'confirmed'
      }));
      alert(`✓ Invoice Confirmed!\n\nInvoice Number: ${response.data.number}`);
      fetchInvoice();
    } catch (error) {
      console.error('Error confirming invoice:', error);
      alert('Failed to confirm invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!isEditMode) {
      navigate('/admin/invoices');
      return;
    }

    if (!window.confirm('Cancel this invoice?')) return;

    try {
      setLoading(true);
      await axios.patch(`/invoices/${id}/status`, { status: 'cancelled' });
      setFormData(prev => ({ ...prev, status: 'cancelled' }));
      alert('✓ Invoice cancelled');
      fetchInvoice();
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      alert('Failed to cancel invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!isEditMode) {
      alert('Please save the invoice first');
      return;
    }

    if (!window.confirm('Send this invoice to the customer via email?')) return;

    try {
      setLoading(true);
      await axios.post(`/invoices/${id}/send`);
      alert('✓ Invoice sent successfully!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!isEditMode) {
      alert('Please save the invoice first');
      return;
    }

    if (!window.confirm('Mark this invoice as paid?')) return;

    try {
      setLoading(true);
      await axios.patch(`/invoices/${id}/status`, { status: 'paid' });
      setFormData(prev => ({ ...prev, status: 'paid' }));
      alert('✓ Invoice marked as paid!');
      fetchInvoice();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark as paid');
    } finally {
      setLoading(false);
    }
  };

  const handlePaidCheckbox = async (e) => {
    const isPaid = e.target.checked;
    
    if (!isEditMode) return;

    try {
      setLoading(true);
      await axios.patch(`/invoices/${id}/status`, { status: isPaid ? 'paid' : 'posted' });
      setFormData(prev => ({ ...prev, status: isPaid ? 'paid' : 'posted' }));
    } catch (error) {
      console.error('Error updating paid status:', error);
      alert('Failed to update paid status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateTotal();
  }, [orderLines]);

  return (
    <div style={{ fontFamily: 'Quicksand, sans-serif', background: '#1a1a1a', minHeight: '100vh', padding: '2rem' }}>
      {/* Action Bar */}
      <div style={{
        background: '#2a2a2a',
        border: '2px solid #d97706',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handleDelete} disabled={!isEditMode || loading} style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#d97706',
              border: '2px solid #d97706',
              borderRadius: '8px',
              cursor: !isEditMode || loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: !isEditMode ? 0.5 : 1
            }}>
              🗑️
            </button>

            {/* Draft State Buttons */}
            {formData.status === 'draft' && (
              <>
                <button onClick={handleConfirm} disabled={loading || !isEditMode} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: (loading || !isEditMode) ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  opacity: (loading || !isEditMode) ? 0.5 : 1
                }}>
                  Confirm
                </button>

                <button onClick={handleCancel} disabled={loading} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Cancel
                </button>
              </>
            )}

            {/* Confirmed State Buttons */}
            {(formData.status === 'confirmed' || formData.status === 'posted') && (
              <>
                <button onClick={() => alert('View subscription')} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Subscription
                </button>

                <button onClick={() => window.print()} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Preview
                </button>

                <button onClick={handleSend} disabled={loading} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Send
                </button>

                <button onClick={handlePay} disabled={loading} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Pay
                </button>

                <button onClick={() => window.print()} style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Print
                </button>
              </>
            )}
          </div>

          {/* Right: Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.75rem 1.5rem',
              background: formData.status === 'draft' ? '#d97706' : 'transparent',
              color: formData.status === 'draft' ? '#1a1a1a' : '#d97706',
              border: '2px solid #d97706',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Draft
            </div>
            
            <div style={{
              padding: '0.75rem 1.5rem',
              background: (formData.status === 'confirmed' || formData.status === 'posted') ? '#d97706' : 'transparent',
              color: (formData.status === 'confirmed' || formData.status === 'posted') ? '#1a1a1a' : '#d97706',
              border: '2px solid #d97706',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Confirmed
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div style={{
        background: '#2a2a2a',
        border: '2px solid #d97706',
        borderRadius: '12px',
        padding: '2rem'
      }}>
        {/* Form Fields */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d97706', fontWeight: '600' }}>
              Customer
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a1a1a',
                color: '#d97706',
                border: '2px solid #d97706',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d97706', fontWeight: '600' }}>
                Invoice Date
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d97706', fontWeight: '600' }}>
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Paid Checkbox - Only show when confirmed */}
          {(formData.status === 'confirmed' || formData.status === 'posted' || formData.status === 'paid') && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '1rem',
                background: '#1a1a1a',
                border: '2px solid #d97706',
                borderRadius: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={formData.status === 'paid'}
                  onChange={handlePaidCheckbox}
                  disabled={loading}
                  style={{
                    width: '24px',
                    height: '24px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    accentColor: '#d97706'
                  }}
                />
                <span style={{ color: '#d97706', fontWeight: '600', fontSize: '1.1rem' }}>
                  Paid
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #d97706', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('order_lines')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === 'order_lines' ? '#d97706' : 'transparent',
                color: activeTab === 'order_lines' ? '#1a1a1a' : '#d97706',
                border: '2px solid #d97706',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Order Lines
            </button>
            <button
              onClick={() => setActiveTab('other_info')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === 'other_info' ? '#d97706' : 'transparent',
                color: activeTab === 'other_info' ? '#1a1a1a' : '#d97706',
                border: '2px solid #d97706',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Other Info
            </button>
          </div>
        </div>

        {/* Order Lines Tab */}
        {activeTab === 'order_lines' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #d97706' }}>
              <thead>
                <tr style={{ background: '#1a1a1a', borderBottom: '2px dashed #d97706' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#d97706', fontWeight: '600', borderRight: '2px dashed #d97706' }}>Product</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#d97706', fontWeight: '600', borderRight: '2px dashed #d97706' }}>Quantity</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#d97706', fontWeight: '600', borderRight: '2px dashed #d97706' }}>Unit Price</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#d97706', fontWeight: '600', borderRight: '2px dashed #d97706' }}>Taxes</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#d97706', fontWeight: '600' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {orderLines.map((line, index) => (
                  <tr key={index} style={{ borderBottom: '2px dashed #d97706' }}>
                    <td style={{ padding: '1rem', borderRight: '2px dashed #d97706' }}>
                      <select
                        value={line.product_id}
                        onChange={(e) => handleLineChange(index, 'product_id', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#1a1a1a',
                          color: '#d97706',
                          border: '1px solid #d97706',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', borderRight: '2px dashed #d97706' }}>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          background: '#1a1a1a',
                          color: '#d97706',
                          border: '1px solid #d97706',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', borderRight: '2px dashed #d97706' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => handleLineChange(index, 'unit_price', e.target.value)}
                        style={{
                          width: '100px',
                          padding: '0.5rem',
                          background: '#1a1a1a',
                          color: '#d97706',
                          border: '1px solid #d97706',
                          borderRadius: '4px',
                          textAlign: 'right'
                        }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', borderRight: '2px dashed #d97706' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={line.tax_rate}
                        onChange={(e) => handleLineChange(index, 'tax_rate', e.target.value)}
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          background: '#1a1a1a',
                          color: '#d97706',
                          border: '1px solid #d97706',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#d97706', fontWeight: '600' }}>
                      ${line.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={addLine}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#d97706',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                + Add Line
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </div>
        )}

        {/* Other Info Tab */}
        {activeTab === 'other_info' && (
          <div style={{ color: '#d97706' }}>
            <p>Additional invoice information can be added here.</p>
          </div>
        )}
      </div>

      {/* Invoice Title at Bottom */}
      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        fontSize: '3rem',
        fontFamily: 'Gabarito, cursive',
        color: '#d97706',
        fontWeight: '700'
      }}>
        Invoice
      </div>
    </div>
  );
};

export default InvoiceFormPage;
