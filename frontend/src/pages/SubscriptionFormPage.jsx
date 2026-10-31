import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const SubscriptionFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('order_lines');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [taxes, setTaxes] = useState([]);
  
  const [formData, setFormData] = useState({
    number: '',
    customer_id: '',
    quotation_template_id: '',
    expiration: '',
    order_date: new Date().toISOString().split('T')[0],
    recurring_plan_id: '',
    payment_terms: 'immediate',
    next_invoice_date: '',
    status: 'draft',
    recurring_amount: 0,
    salesperson: currentUser?.name || '',
    payment_method: 'bank_transfer',
    start_date: new Date().toISOString().split('T')[0],
    payment_done: false
  });

  const [orderLines, setOrderLines] = useState([
    { product_id: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 10, amount: 0 }
  ]);

  useEffect(() => {
    fetchData();
    if (isEditMode) {
      fetchSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching subscription form data...');
      const [customersRes, productsRes, plansRes, templatesRes, taxesRes] = await Promise.all([
        axios.get('/customers'),
        axios.get('/products'),
        axios.get('/recurring-plans'),
        axios.get('/quotation-templates'),
        axios.get('/taxes')
      ]);
      console.log('Data fetched successfully:', {
        customers: customersRes.data.length,
        products: productsRes.data.length,
        plans: plansRes.data.length,
        templates: templatesRes.data.length,
        taxes: taxesRes.data.length
      });
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
      setPlans(plansRes.data);
      setTemplates(templatesRes.data);
      setTaxes(taxesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to load form data. Please check console for details.');
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`/subscriptions/${id}`);
      const sub = response.data;
      setFormData({
        number: sub.number || '',
        customer_id: sub.customer_id,
        quotation_template_id: sub.quotation_template_id || '',
        expiration: sub.expiration || '',
        order_date: sub.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        recurring_plan_id: sub.recurring_plan_id,
        payment_terms: sub.payment_terms || 'immediate',
        next_invoice_date: sub.next_billing_date || '',
        status: sub.status,
        recurring_amount: sub.recurring_amount || 0,
        salesperson: currentUser?.name || '',
        payment_method: 'bank_transfer',
        start_date: sub.start_date || new Date().toISOString().split('T')[0],
        payment_done: sub.payment_done || false
      });
      if (sub.lines && sub.lines.length > 0) {
        setOrderLines(sub.lines.map(line => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount,
          tax_rate: line.tax_rate,
          amount: line.subtotal
        })));
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...orderLines];
    newLines[index][field] = field === 'product_id' ? value : (parseFloat(value) || 0);
    
    // Auto-fill unit price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newLines[index].unit_price = product.base_price || 0;
      }
    }
    
    // Calculate amount: (Qty * Price) - Discount + Taxes
    const line = newLines[index];
    const subtotal = (line.quantity * line.unit_price) - line.discount;
    const taxAmount = subtotal * (line.tax_rate / 100);
    line.amount = subtotal + taxAmount;
    
    setOrderLines(newLines);
    calculateTotal(newLines);
  };

  const addLine = () => {
    setOrderLines([...orderLines, { product_id: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 10, amount: 0 }]);
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
    setFormData(prev => ({ ...prev, recurring_amount: total }));
    return total;
  };

  const handleNew = () => {
    navigate('/admin/subscriptions/new');
    window.location.reload();
  };

  const handleSave = async () => {
    // Validation
    if (!formData.customer_id) {
      alert('Please select a customer before saving.');
      return;
    }

    if (!formData.recurring_plan_id) {
      alert('Please select a recurring plan before saving.');
      return;
    }

    if (orderLines.length === 0 || !orderLines[0].product_id) {
      alert('Please add at least one product to the order lines.');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        customer_id: parseInt(formData.customer_id),
        product_id: parseInt(orderLines[0]?.product_id || 1),
        recurring_plan_id: parseInt(formData.recurring_plan_id) || 1,
        start_date: formData.start_date,
        payment_done: formData.payment_done,
        lines: orderLines.map(line => ({
          product_id: parseInt(line.product_id),
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount: line.discount,
          tax_rate: line.tax_rate
        }))
      };

      if (isEditMode) {
        await axios.put(`/subscriptions/${id}`, payload);
        alert('✓ Subscription saved successfully!');
        fetchSubscription();
      } else {
        const response = await axios.post('/subscriptions', payload);
        alert('✓ Subscription created successfully!\n\nYou can now Send or Confirm the subscription.');
        navigate(`/admin/subscriptions/${response.data.id}`);
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Failed to save subscription:\n\n${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    // Role-based delete restriction: Only admin can delete
    if (currentUser?.role !== 'admin') {
      alert('Access Denied: Only administrators can delete subscriptions.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`/subscriptions/${id}`);
      alert('✓ Subscription deleted successfully!');
      navigate('/admin/subscriptions');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Failed to delete subscription: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Enhanced CSV export with subscription details
    const subscriptionInfo = [
      ['Subscription Export'],
      [''],
      ['Subscription Number', formData.number || 'Draft'],
      ['Customer', customers.find(c => c.id === parseInt(formData.customer_id))?.name || 'N/A'],
      ['Status', formData.status],
      ['Order Date', formData.order_date],
      ['Start Date', formData.start_date],
      ['Recurring Plan', plans.find(p => p.id === parseInt(formData.recurring_plan_id))?.name || 'N/A'],
      ['Payment Terms', formData.payment_terms],
      [''],
      ['Order Lines'],
      ['Product', 'Quantity', 'Unit Price', 'Discount', 'Tax Rate (%)', 'Amount']
    ];

    const orderLinesData = orderLines.map(line => {
      const product = products.find(p => p.id === parseInt(line.product_id));
      return [
        product?.name || 'N/A',
        line.quantity,
        line.unit_price.toFixed(2),
        line.discount.toFixed(2),
        line.tax_rate,
        line.amount.toFixed(2)
      ];
    });

    const totals = [
      [''],
      ['', '', '', '', 'Total Recurring Amount', formData.recurring_amount.toFixed(2)]
    ];

    const csvContent = [
      ...subscriptionInfo,
      ...orderLinesData,
      ...totals
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription_${formData.number || 'draft'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!isEditMode) {
      alert('Please save the subscription first before sending.');
      return;
    }

    if (!formData.customer_id) {
      alert('Please select a customer before sending the quotation.');
      return;
    }

    if (!window.confirm('Send this quotation to the customer? They will receive an email with a link to view and sign.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/subscriptions/${id}`, { status: 'sent' });
      setFormData(prev => ({ ...prev, status: 'sent' }));
      
      const customer = customers.find(c => c.id === parseInt(formData.customer_id));
      alert(
        `✓ Quotation Sent Successfully!\n\n` +
        `Sent to: ${customer?.name || 'Customer'}\n` +
        `Email: ${customer?.email || 'N/A'}\n\n` +
        `The customer can now view and sign the quotation.`
      );
    } catch (error) {
      console.error('Error sending subscription:', error);
      alert('Failed to send quotation: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isEditMode) {
      alert('Please save the subscription first before confirming.');
      return;
    }

    if (!window.confirm('Confirm this subscription? This will generate a subscription number and set it to active.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/subscriptions/${id}/confirm`);
      
      // Update form data with confirmed subscription details
      setFormData(prev => ({
        ...prev,
        number: response.data.number,
        status: response.data.status,
        start_date: response.data.start_date
      }));
      
      // Show success message with details
      alert(
        `✓ Subscription Confirmed Successfully!\n\n` +
        `Subscription Number: ${response.data.number}\n` +
        `Status: Confirmed\n` +
        `Start Date: ${response.data.start_date}\n\n` +
        `A draft invoice will be generated automatically.`
      );
      
      // Refresh subscription data
      fetchSubscription();
    } catch (error) {
      console.error('Error confirming subscription:', error);
      alert('Failed to confirm subscription: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!isEditMode) {
      alert('Please save the subscription first before previewing.');
      return;
    }

    // Open preview in new window
    const previewUrl = `/share/quotation/${id}`;
    window.open(previewUrl, '_blank', 'width=800,height=1000');
  };

  const handleCreateInvoice = async () => {
    if (!isEditMode || formData.status !== 'confirmed') {
      alert('Subscription must be confirmed before creating an invoice.');
      return;
    }

    if (!window.confirm('Create a new invoice from this subscription?')) {
      return;
    }

    try {
      setLoading(true);
      // Call backend to create invoice from subscription
      const response = await axios.post(`/subscriptions/${id}/create-invoice`);
      alert(
        `✓ Invoice Created Successfully!\n\n` +
        `Invoice Number: ${response.data.invoice_number}\n` +
        `Amount: $${response.data.amount}\n\n` +
        `You can view it in the Invoices section.`
      );
      navigate('/admin/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      // If endpoint doesn't exist yet, show placeholder message
      if (error.response?.status === 404) {
        alert('Invoice creation feature will be implemented soon.\n\nThis will automatically generate an invoice based on the subscription order lines.');
      } else {
        alert('Failed to create invoice: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!isEditMode || formData.status !== 'confirmed') {
      alert('Only confirmed subscriptions can be renewed.');
      return;
    }

    if (!window.confirm('Renew this subscription?\n\nThis will:\n- Create a new subscription order with the same order lines\n- Update the credit date and next invoice date\n- Extend the subscription period')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/subscriptions/${id}/renew`);
      alert(
        `✓ Subscription Renewed Successfully!\n\n` +
        `New Subscription Number: ${response.data.new_subscription_number}\n` +
        `Next Billing Date: ${response.data.next_billing_date}\n` +
        `New End Date: ${response.data.new_end_date}\n\n` +
        `A new subscription order has been created with the same order lines.`
      );
      fetchSubscription();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      alert('Failed to renew subscription: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpsell = async () => {
    if (!isEditMode || formData.status !== 'confirmed') {
      alert('Only confirmed subscriptions can be upgraded.');
      return;
    }

    if (!window.confirm('Upsell/Upgrade this subscription?\n\nThis will:\n- Create a new order to change or upgrade the subscription\n- Allow you to add different products\n- Update subscription with new pricing\n\nYou will be redirected to create the upsell order.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/subscriptions/${id}/upsell`);
      alert(
        `✓ Upsell Order Created!\n\n` +
        `Order Number: ${response.data.order_number}\n` +
        `Status: ${response.data.status}\n\n` +
        `You can now add products to upgrade the subscription.`
      );
      // Redirect to the new order/subscription form
      navigate(`/admin/subscriptions/${response.data.new_subscription_id}`);
    } catch (error) {
      console.error('Error creating upsell:', error);
      alert('Failed to create upsell: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };


  const handlePause = async () => {
    if (!window.confirm('Pause this subscription? Automated billing will be paused.')) return;
    try {
      setLoading(true);
      await axios.post(/subscriptions//pause);
      alert('✓ Subscription paused successfully.');
      fetchSubscription();
    } catch (err) {
      alert('Failed to pause: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!window.confirm('Resume this subscription? Automated billing will resume.')) return;
    try {
      setLoading(true);
      await axios.post(/subscriptions//resume);
      alert('✓ Subscription resumed successfully.');
      fetchSubscription();
    } catch (err) {
      alert('Failed to resume: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this subscription early? No further invoices will be generated.')) return;
    try {
      setLoading(true);
      await axios.post(/subscriptions//close);
      alert('✓ Subscription closed successfully.');
      fetchSubscription();
    } catch (err) {
      alert('Failed to close: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateTotal();
  }, [orderLines]);

  return (
    <div style={{ fontFamily: 'Quicksand, sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Smart Action Bar */}
      <div style={{
        background: 'white',
        borderBottom: '2px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Document Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleNew}
              style={{
                padding: '0.6rem 1.25rem',
                background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(135, 90, 123, 0.2)'
              }}
            >
              New
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              title="Save"
              style={{
                padding: '0.6rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              💾
            </button>

            <button
              onClick={handleDelete}
              disabled={!isEditMode || loading || currentUser?.role !== 'admin'}
              title={currentUser?.role !== 'admin' ? 'Admin only' : 'Delete'}
              style={{
                padding: '0.6rem',
                background: (!isEditMode || currentUser?.role !== 'admin') ? '#d4d4d8' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (!isEditMode || loading || currentUser?.role !== 'admin') ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🗑️
            </button>

            <button
              onClick={handlePrint}
              title="Print"
              style={{
                padding: '0.6rem',
                background: '#875A7B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🖨️
            </button>

            <button
              onClick={handleExport}
              title="Export CSV"
              style={{
                padding: '0.6rem',
                background: '#714B67',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              📊
            </button>

            <div style={{ width: '1px', height: '30px', background: '#e5e7eb', margin: '0 0.5rem' }} />

            {/* Workflow Actions - Dynamic based on status */}
            {formData.status === 'draft' && (
              <>
                <button
                  onClick={handleSend}
                  disabled={loading || !isEditMode}
                  title={!isEditMode ? 'Save the subscription first to enable this button' : 'Send quotation to customer'}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: !isEditMode ? '#d4d4d8' : '#875A7B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: !isEditMode || loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    position: 'relative'
                  }}
                >
                  Send
                  {!isEditMode && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      !
                    </span>
                  )}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !isEditMode}
                  title={!isEditMode ? 'Save the subscription first to enable this button' : 'Confirm subscription'}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: !isEditMode ? '#d4d4d8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: !isEditMode || loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    position: 'relative'
                  }}
                >
                  Confirm
                  {!isEditMode && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      !
                    </span>
                  )}
                </button>
              </>
            )}

            {formData.status === 'sent' && (
              <>
                <button
                  onClick={handlePreview}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#875A7B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Preview
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Confirm
                </button>
              </>
            )}

            {(formData.status === 'confirmed' || formData.status === 'active') && (
              <>
                <button
                  onClick={handleCreateInvoice}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(135, 90, 123, 0.2)'
                  }}
                >
                  Create Invoice
                </button>
                <button
                  onClick={handlePause}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#d97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Pause
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Close Early
                </button>
                <button
                  onClick={handleRenew}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#875A7B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Renew
                </button>
                <button
                  onClick={handleUpsell}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#875A7B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Upsell
                </button>
              </>
            )}

            {formData.status === 'paused' && (
              <>
                <button
                  onClick={handleResume}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Resume
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Close Early
                </button>
              </>
            )}

            {formData.status === 'closed' && (
              <span style={{
                padding: '0.6rem 1.25rem',
                background: '#f1f5f9',
                color: '#475569',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Subscription is Closed
              </span>
            )}
          </div>

          {/* Right: State Progress Bar with Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Quotation Badge */}
            <div style={{
              padding: '0.6rem 1.25rem',
              background: formData.status === 'draft' ? '#875A7B' : '#e5e7eb',
              color: formData.status === 'draft' ? 'white' : '#71717a',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: formData.status === 'draft' ? '2px solid #875A7B' : '2px solid #e5e7eb',
              boxShadow: formData.status === 'draft' ? '0 2px 8px rgba(135, 90, 123, 0.25)' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {formData.status === 'draft' && <span>📝</span>}
              Quotation
            </div>
            
            <div style={{ fontSize: '1.2rem', color: '#71717a' }}>→</div>
            
            {/* Quotation Sent Badge */}
            <div style={{
              padding: '0.6rem 1.25rem',
              background: formData.status === 'sent' ? '#f59e0b' : '#e5e7eb',
              color: formData.status === 'sent' ? 'white' : '#71717a',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: formData.status === 'sent' ? '2px solid #f59e0b' : '2px solid #e5e7eb',
              boxShadow: formData.status === 'sent' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {formData.status === 'sent' && <span>📧</span>}
              Quotation Sent
            </div>
            
            <div style={{ fontSize: '1.2rem', color: '#71717a' }}>→</div>
            
            {/* Confirmed Badge */}
            <div style={{
              padding: '0.6rem 1.25rem',
              background: formData.status === 'confirmed' ? '#10b981' : '#e5e7eb',
              color: formData.status === 'confirmed' ? 'white' : '#71717a',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: formData.status === 'confirmed' ? '2px solid #10b981' : '2px solid #e5e7eb',
              boxShadow: formData.status === 'confirmed' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {formData.status === 'confirmed' && <span>✅</span>}
              Confirmed
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem' }}>
        {/* Header with Subscription Number */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2rem',
            color: '#18181b',
            marginBottom: '0.5rem'
          }}>
            {formData.number || 'New Subscription'}
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            {formData.status === 'draft' && '📝 Draft - Configure subscription details and save'}
            {formData.status === 'sent' && '📧 Quotation Sent - Awaiting customer confirmation'}
            {formData.status === 'confirmed' && '✅ Confirmed - Subscription is active and billing'}
          </p>
          
          {/* Help Banner for New Subscriptions */}
          {!isEditMode && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem 1.5rem',
              background: '#FDF8FB',
              border: '2px solid #EADBE7',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <div>
                <div style={{ fontWeight: '600', color: '#714B67', marginBottom: '0.25rem' }}>
                  Getting Started
                </div>
                <div style={{ fontSize: '0.9rem', color: '#875A7B' }}>
                  Fill in the subscription details below, then click the <strong>Save</strong> button (💾) to enable Send and Confirm actions.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Header Form */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Subscription Number
                </label>
                <input
                  type="text"
                  value={formData.number || 'Auto-generated on confirm'}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#f9fafb',
                    color: '#71717a',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Customer *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    background: 'white'
                  }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Quotation Template
                </label>
                <select
                  name="quotation_template_id"
                  value={formData.quotation_template_id}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    background: 'white'
                  }}
                >
                  <option value="">Select Template (Optional)</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Expiration
                </label>
                <input
                  type="date"
                  name="expiration"
                  value={formData.expiration}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.25rem' }}>
                  Quotation expiry date (after this, customer cannot sign)
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Order Date
                </label>
                <input
                  type="date"
                  name="order_date"
                  value={formData.order_date}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Recurring Plan *
                </label>
                <select
                  name="recurring_plan_id"
                  value={formData.recurring_plan_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    background: 'white'
                  }}
                >
                  <option value="">Select Plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Payment Terms
                </label>
                <select
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    background: 'white'
                  }}
                >
                  <option value="immediate">Immediate Payment</option>
                  <option value="15_days">15 Days</option>
                  <option value="30_days">30 Days</option>
                  <option value="45_days">45 Days</option>
                  <option value="60_days">60 Days</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#18181b',
                  fontSize: '0.9rem'
                }}>
                  Next Invoice Date
                </label>
                <input
                  type="date"
                  name="next_invoice_date"
                  value={formData.next_invoice_date}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Notebook Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <button
              onClick={() => setActiveTab('order_lines')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'order_lines' ? 'white' : 'transparent',
                color: activeTab === 'order_lines' ? '#875A7B' : '#71717a',
                border: 'none',
                borderBottom: activeTab === 'order_lines' ? '3px solid #875A7B' : '3px solid transparent',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease'
              }}
            >
              Order Lines
            </button>
            <button
              onClick={() => setActiveTab('other_info')}
              style={{
                padding: '1rem 2rem',
                background: activeTab === 'other_info' ? 'white' : 'transparent',
                color: activeTab === 'other_info' ? '#875A7B' : '#71717a',
                border: 'none',
                borderBottom: activeTab === 'other_info' ? '3px solid #875A7B' : '3px solid transparent',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease'
              }}
            >
              Other Info
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'order_lines' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.25rem',
                    color: '#18181b'
                  }}>
                    Order Lines
                  </h3>
                  <button
                    onClick={addLine}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(135, 90, 123, 0.2)'
                    }}
                  >
                    + Add Line
                  </button>
                </div>

                {/* Order Lines Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #e5e7eb'
                  }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '200px'
                        }}>
                          Product
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          width: '100px'
                        }}>
                          Quantity
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          width: '120px'
                        }}>
                          Unit Price
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          width: '100px'
                        }}>
                          Discount
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          width: '100px'
                        }}>
                          Taxes (%)
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          width: '120px'
                        }}>
                          Amount
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          borderBottom: '2px solid #e5e7eb',
                          width: '60px'
                        }}>
                          
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((line, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '1rem' }}>
                            <select
                              value={line.product_id}
                              onChange={(e) => handleLineChange(index, 'product_id', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '0.9rem'
                              }}
                            >
                              <option value="">Select Product</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                              min="1"
                              step="1"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                textAlign: 'right',
                                fontSize: '0.9rem'
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input
                              type="number"
                              value={line.unit_price}
                              onChange={(e) => handleLineChange(index, 'unit_price', e.target.value)}
                              min="0"
                              step="0.01"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                textAlign: 'right',
                                fontSize: '0.9rem'
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input
                              type="number"
                              value={line.discount}
                              onChange={(e) => handleLineChange(index, 'discount', e.target.value)}
                              min="0"
                              step="0.01"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                textAlign: 'right',
                                fontSize: '0.9rem'
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <input
                              type="number"
                              value={line.tax_rate}
                              onChange={(e) => handleLineChange(index, 'tax_rate', e.target.value)}
                              min="0"
                              step="0.1"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                textAlign: 'right',
                                fontSize: '0.9rem'
                              }}
                            />
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#18181b',
                            fontSize: '0.95rem'
                          }}>
                            ${line.amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button
                              onClick={() => removeLine(index)}
                              disabled={orderLines.length === 1}
                              style={{
                                padding: '0.5rem',
                                background: 'transparent',
                                color: orderLines.length === 1 ? '#d4d4d8' : '#ef4444',
                                border: 'none',
                                cursor: orderLines.length === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '1.2rem'
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div style={{
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '2rem'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#18181b'
                  }}>
                    Total Recurring Amount:
                  </span>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#10b981',
                    fontFamily: 'Gabarito, sans-serif'
                  }}>
                    ${formData.recurring_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'other_info' && (
              <div>
                <h3 style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.25rem',
                  color: '#18181b',
                  marginBottom: '1.5rem'
                }}>
                  Additional Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#18181b',
                        fontSize: '0.9rem'
                      }}>
                        Salesperson
                      </label>
                      <input
                        type="text"
                        name="salesperson"
                        value={formData.salesperson}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.25rem' }}>
                        Defaults to logged-in user
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#18181b',
                        fontSize: '0.9rem'
                      }}>
                        Payment Method
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          background: 'white'
                        }}
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="upi">UPI</option>
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#18181b',
                        fontSize: '0.9rem'
                      }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.25rem' }}>
                        When subscription billing begins
                      </div>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#71717a',
                        marginBottom: '0.5rem'
                      }}>
                        Status
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#18181b',
                        textTransform: 'capitalize'
                      }}>
                        {formData.status}
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background: '#f0fdf4',
                        border: '2px solid #86efac',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="checkbox"
                          name="payment_done"
                          checked={formData.payment_done}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_done: e.target.checked }))}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#10b981'
                          }}
                        />
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: '#18181b',
                            fontSize: '0.95rem'
                          }}>
                            Payment Done
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#71717a',
                            marginTop: '0.25rem'
                          }}>
                            Check this after payment is received
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Print Styles */}
      <style>{`
        @media print {
          /* Hide all navigation and buttons */
          .left-sidebar,
          .top-nav,
          .top-navbar,
          button,
          .no-print,
          nav,
          .nav-left,
          .nav-right,
          .nav-center {
            display: none !important;
          }
          
          /* Clean white background */
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          
          /* Remove margins and padding from main content */
          .main-content,
          .admin-home {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Ensure content fills page */
          div[style*="padding: 2rem"] {
            padding: 1rem !important;
          }

          /* Hide action bar in print */
          div[style*="position: sticky"] {
            display: none !important;
          }

          /* Clean table borders for print */
          table {
            border-collapse: collapse !important;
            page-break-inside: avoid;
          }

          /* Ensure tabs don't show in print */
          div[style*="borderBottom: '2px solid #e5e7eb'"] {
            display: none !important;
          }

          /* Show all tab content in print */
          div[style*="padding: 2rem"] > div {
            display: block !important;
          }

          /* Page breaks */
          .page-break {
            page-break-after: always;
          }

          /* Print header */
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionFormPage;
