import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    // Phase 1: Hardcoded Role-Based Access Control (RBAC)
    // We will migrate this to encrypted SaaS logins in the future
    const users = {
      "admin": { pass: "admin123", role: "Admin" },
      "purchase": { pass: "buy123", role: "Purchase Manager" },
      "sales": { pass: "sell123", role: "Sales Exec" },
      "inventory": { pass: "stock123", role: "Inventory Head" }
    };

    const user = users[username.toLowerCase().trim()];

    if (user && user.pass === password) {
      setError('');
      // We now pass BOTH the username and the role back to the App
      onLogin({ username, role: user.role });
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Stockwise ERP</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              required
            />
          </div>
          
          {error && <p style={{ color: 'red', fontSize: '14px', margin: '0' }}>{error}</p>}
          
          <button 
            type="submit" 
            style={{ padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
          >
            Secure Login
          </button>
        </form>

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '13px', color: '#555' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Test Accounts for Roles:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>Admin:</strong> admin / admin123</li>
            <li><strong>Purchase:</strong> purchase / buy123</li>
            <li><strong>Sales:</strong> sales / sell123</li>
            <li><strong>Inventory:</strong> inventory / stock123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
