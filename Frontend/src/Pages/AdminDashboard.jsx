import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/admin.css';

// Yahan Vite Environment Variable setup ho gaya hai
const API_BASE = `${import.meta.env.VITE_BACKEND_API_URL}/api`;

function generateAdminReference(prefix = 'tx_admin') {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function AdminDashboard() {
  const [centres, setCentres] = useState([]);
  const [centreName, setCentreName] = useState('');
  const [location, setLocation] = useState('');

  const [selectedCentre, setSelectedCentre] = useState('');
  const [testName, setTestName] = useState('');
  const [price, setPrice] = useState('');

  const [allBookings, setAllBookings] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [eventId, setEventId] = useState('evt_admin_audit_101');
  const [log, setLog] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const token = sessionStorage.getItem('auth_token');

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      try {
        // API_BASE use kiya
        const cRes = await axios.get(`${API_BASE}/centres`);
        const list = cRes.data.data?.centres || [];
        if (isMounted) {
          setCentres(list);
          if (list.length > 0) {
            setSelectedCentre(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading centres:', err);
      }

      // Fetch paid / verifiable bookings for Admin
      try {
        // API_BASE use kiya
        const bRes = await axios.get(`${API_BASE}/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          // Extra frontend protection
          const filterList = (bRes.data.data?.bookings || []).filter(
            (b) => b.isPaidByPatient || b.status === 'CONFIRMED'
          );
          setAllBookings(filterList);
        }
      } catch (err) {
        console.error('Error loading bookings:', err);
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [token, refreshTrigger]);

  const handleAddCentre = async (e) => {
    e.preventDefault();
    if (!centreName || !location) return alert('Centre Name & Location required');

    try {
      // API_BASE use
      await axios.post(
        `${API_BASE}/centres`,
        { name: centreName, location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Centre successfully added');
      setCentreName('');
      setLocation('');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Centre add ?');
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!selectedCentre || !testName || !price) {
      return alert('Centre, Test Name & Price should not vacant');
    }
    try {
      // API_BASE use 
      await axios.post(
        `${API_BASE}/centres/${selectedCentre}/tests`,
        {
          name: testName,
          price: Number(price),
          description: 'Standard diagnostic test',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Test successfully added');
      setTestName('');
      setPrice('');
    } catch (err) {
      alert(err.response?.data?.message || 'Test add not add');
    }
  };

  const selectBookingForWebhook = (id) => {
    setBookingId(id);
    setEventId(generateAdminReference('evt'));
  };

  const handleWebhook = async (isReplay) => {
    if (!bookingId || !eventId) {
      return alert('First choose Paid Booking then you "Select" click ');
    }
    const txRef = generateAdminReference('tx_admin');
    try {
      // API_BASE use kiya
      const res = await axios.post(`${API_BASE}/payments/webhook`, {
        eventId,
        bookingId,
        status: 'SUCCESS',
        amount: 500,
        providerReference: txRef,
      });
      setLog(`[${isReplay ? 'REPLAY RESULT' : 'WEBHOOK DELIVERED'}]:\n` + JSON.stringify(res.data, null, 2));
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setLog('Error: ' + JSON.stringify(err.response?.data || err.message, null, 2));
    }
  };

  return (
    <div className="admin-container">
      {/* Left: Manage Catalog */}
      <div className="dashboard-card">
        <h3 className="card-heading">Manage Catalog (Admin)</h3>

        <form onSubmit={handleAddCentre} className="admin-sub-card">
          <h4>Add Diagnostic Centre</h4>
          <div className="form-group">
            <input
              className="form-control"
              placeholder="Centre Name"
              value={centreName}
              onChange={(e) => setCentreName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              className="form-control"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit">+ Add Centre</button>
        </form>

        <form onSubmit={handleAddTest} className="admin-sub-card">
          <h4>Add Test to Centre</h4>
          <div className="form-group">
            <select
              className="form-control"
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
            >
              {centres.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <input
              className="form-control"
              placeholder="Test Name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              className="form-control"
              placeholder="Price (₹)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit">+ Add Test</button>
        </form>
      </div>

      {/* Right: Webhook Inspector & Verified Paid Bookings */}
      <div>
        <div className="dashboard-card" style={{ marginBottom: '20px' }}>
          <h3 className="card-heading">Webhook Inspector</h3>
          <div className="form-group">
            <label className="form-label">Target Booking ID</label>
            <input
              className="form-control"
              placeholder="Click 'Select' on a Paid booking below"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Event ID (Idempotency Key)</label>
            <input
              className="form-control"
              placeholder="Event ID"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            />
          </div>

          <div className="btn-action-group">
            <button type="button" onClick={() => handleWebhook(false)} className="btn-action">
              Deliver Webhook
            </button>
            <button type="button" onClick={() => handleWebhook(true)} className="btn-action btn-replay">
              Replay (Idempotent)
            </button>
          </div>

          <pre className="log-terminal">
            {log || '// Webhook logs will appear here...'}
          </pre>
        </div>

        {/* Paid Bookings Queue */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 className="card-heading" style={{ margin: 0 }}>Paid Bookings Queue</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Only patient-paid bookings appear here for Webhook settlement</p>
            </div>
            <button 
              type="button" 
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              style={{ background: '#e2e8f0', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
              Refresh
            </button>
          </div>

          {allBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No any paid booking webhook verification remain pending.</p>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {allBookings.map((b) => (
                <div 
                  key={b._id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    background: bookingId === b._id ? '#e0f2fe' : 'transparent',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{b.testId?.name || 'Diagnostic Test'}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Patient: {b.userId?.name || 'Patient'} | ₹{b.amount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                      Payment: PAID ✓
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge badge-${b.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {b.status}
                    </span>
                    {b.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => selectBookingForWebhook(b._id)}
                        style={{
                          display: 'block',
                          marginTop: '4px',
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}>
                        Select
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}