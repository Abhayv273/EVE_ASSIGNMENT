import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/patient.css';

// Yahan Vite Environment Variable setup 
const API_BASE = `${import.meta.env.VITE_BACKEND_API_URL}/api`;

export default function PatientDashboard() {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [bookings, setBookings] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const token = sessionStorage.getItem('auth_token');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // API_BASE use kiya
        const cRes = await axios.get(`${API_BASE}/centres`);
        const cList = cRes.data.data?.centres || [];

        if (isMounted && centres.length === 0) {
          setCentres(cList);
          if (cList.length > 0) {
            setSelectedCentre(cList[0]._id);
            // API_BASE use kiya
            const tRes = await axios.get(`${API_BASE}/centres/${cList[0]._id}/tests`);
            const tList = tRes.data.data?.tests || [];
            setTests(tList);
            if (tList.length > 0) {
              setSelectedTest(tList[0]._id);
            }
          }
        }
      } catch (err) {
        console.error('Centres error:', err);
      }

      if (token) {
        try {
          // API_BASE use kiya
          const bRes = await axios.get(`${API_BASE}/bookings/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (isMounted) {
            setBookings(bRes.data.data?.bookings || []);
          }
        } catch (err) {
          console.error('Bookings error:', err);
        }
      }
    }

    loadData();

    const interval = setInterval(() => {
      if (token && isMounted) {
        // API_BASE use kiya
        axios.get(`${API_BASE}/bookings/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (isMounted) setBookings(res.data.data?.bookings || []);
        }).catch(() => {});
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, refreshTrigger]);

  const handleCentreChange = async (e) => {
    const cId = e.target.value;
    setSelectedCentre(cId);
    try {
      // API_BASE use kiya
      const res = await axios.get(`${API_BASE}/centres/${cId}/tests`);
      const testList = res.data.data?.tests || [];
      setTests(testList);
      if (testList.length > 0) {
        setSelectedTest(testList[0]._id);
      } else {
        setSelectedTest('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedCentre || !selectedTest || !appointmentDate) {
      return alert("All Details Required");
    }
    try {
      // API_BASE use kiya
      await axios.post(
        `${API_BASE}/bookings`,
        {
          centreId: selectedCentre,
          testId: selectedTest,
          appointmentDate: new Date(appointmentDate).toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );   
      alert('Appointment slot selected now proceed to payment.');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Booking Failed');
    }
  };

  const handlePatientPayment = async (bookingId) => {
    try {
      // API_BASE use kiya
      await axios.patch(`${API_BASE}/bookings/${bookingId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Payment Successful & Payment verified, wait for appointment confirmation. Thank you!');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment update issues');
    }
  };

  const unpaidBookings = bookings.filter(
    (b) => b.status === 'PENDING' && !b.isPaidByPatient
  );

  const processingBookings = bookings.filter(
    (b) => b.status === 'PENDING' && b.isPaidByPatient
  );

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');

  return (
    <div className="patient-container">
      {/* Form */}
      <div className="dashboard-card">
        <h3 className="card-heading">Book Appointment</h3>
        <form onSubmit={handleCreateBooking}>
          <div className="form-group">
            <label className="form-label">Diagnostic Centre</label>
            <select className="form-control" value={selectedCentre} onChange={handleCentreChange}>
              {centres.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Diagnostic Test</label>
            <select className="form-control" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} (₹{t.price})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input
              type="datetime-local"
              className="form-control"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-submit">
            Confirm Slot (Step 1: Unpaid)
          </button>
        </form>
      </div>

      {/* Bookings Status */}
      <div>
        {/* Stage 1: Unpaid */}
        <div className="dashboard-card" style={{ marginBottom: '16px' }}>
          <h3 className="card-heading" style={{ color: '#b45309' }}>
            1. Action Required: Pay Now ({unpaidBookings.length})
          </h3>
          {unpaidBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending unpaid appointment.</p>
          ) : (
            unpaidBookings.map((b) => (
              <div key={b._id} className="booking-item" style={{ background: '#fffbeb', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                <div>
                  <strong>{b.testId?.name || 'Diagnostic Test'}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '2px' }}>
                    Centre: {b.centreId?.name} | Amount: ₹{b.amount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                    Status: Unpaid (Admin verification processing...)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="btn-pay" onClick={() => handlePatientPayment(b._id)}>
                    Pay Now (₹{b.amount})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stage 2: Paid by Patient, Awaiting Admin Webhook */}
        <div className="dashboard-card" style={{ marginBottom: '16px', borderLeft: '4px solid #0284c7' }}>
          <h3 className="card-heading" style={{ color: '#0369a1' }}>
            2. Payment Done (Appointment Processing) ({processingBookings.length})
          </h3>
          {processingBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No appointment processing in lists.</p>
          ) : (
            processingBookings.map((b) => (
              <div key={b._id} className="booking-item" style={{ background: '#f0f9ff', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                <div>
                  <strong>{b.testId?.name || 'Diagnostic Test'}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                    Payment Received ✓
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '2px' }}>
                    Appointment Status: ⏳ Processing (Sent to Admin for Confirmation of Appointment)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status-badge" style={{ background: '#bae6fd', color: '#0369a1' }}>
                    PROCESSING
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stage 3: Fully Confirmed Appointments */}
        <div className="dashboard-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <h3 className="card-heading" style={{ color: '#15803d' }}>
            3. Confirmed Appointments ({confirmedBookings.length})
          </h3>
          {confirmedBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Admin appointment confirmation Show here!.</p>
          ) : (
            confirmedBookings.map((b) => (
              <div key={b._id} className="booking-item" style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                <div>
                  <strong>{b.testId?.name || 'Diagnostic Test'}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '2px' }}>
                    Centre: {b.centreId?.name} | Paid: ₹{b.amount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                    Scheduled: {new Date(b.appointmentDate).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status-badge badge-confirmed">CONFIRMED</span>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, marginTop: '4px' }}>
                    Appointment Confirmed ✓
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}