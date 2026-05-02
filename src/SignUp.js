import React, { useState } from 'react';
import './SignUp.css';

const SignUp = ({ onSwitch }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Donor');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword || !accountType) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    alert(`Sign up successful!\nName: ${fullName}\nEmail: ${email}`);
  };

  const handleLoginClick = () => {
    if (onSwitch) onSwitch();
  };

  const handleTermsClick = (e) => {
    e.preventDefault();
    alert("Terms & Conditions");
  };

  const handleGoogleSignUp = () => {
    alert("Google signup coming soon");
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>FOOD DONATION Platform</h1>
          <p>Food Donation Discovery</p>
        </div>

        <div className="signup-tabs">
          <button className="tab" onClick={handleLoginClick}>Login</button>
          <button className="tab active">Sign Up</button>
        </div>

        <form onSubmit={handleSignUp} className="signup-form">
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <select 
              value={accountType} 
              onChange={(e) => setAccountType(e.target.value)}
              required
            >
              <option value="Donor">Donor</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Organization">Organization</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="form-actions">
            <label className="agree-terms">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <span>I agree to the <a href="/" onClick={handleTermsClick}>Terms &amp; Conditions</a></span>
            </label>
          </div>

          <button type="submit" className="signup-button">Sign Up</button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button onClick={handleGoogleSignUp} className="google-button">
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default SignUp;
