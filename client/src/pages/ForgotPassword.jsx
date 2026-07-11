import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import {auth} from '../firebase'; // Adjust this path if your firebase.js file is in a different spot
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      // Firebase automatically handles sending the password reset link!
      await sendPasswordResetEmail(auth, email);
      setMessage('A password reset link has been sent to your email address.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Enter your registered email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <button type="submit" className="btn btn-primary">Send Reset Link</button>
      </form>
      
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      
      <div style={{ marginTop: '15px' }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
export default ForgotPassword;