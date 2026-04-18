import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TopUpPage.css';
const TopUpPage = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 10000) {
      setError('Minimum top-up amount is 10,000 VND');
      return;
    }

    if (parseFloat(amount) > 10000000) {
      setError('Maximum top-up amount is 10,000,000 VND');
      return;
    }

    // Navigate to checkout page with amount
    navigate('/checkout', { state: { amount: parseFloat(amount) } });
  };

  return (
    <div className="topup-page">
      <h1>Top Up Your Wallet</h1>
      <div className="topup-container">
        <div className="topup-info-box">
          <h3>Quick Top-Up</h3>
          <p>Enter the amount you want to add to your wallet</p>
        </div>

        <input
          type="number"
          placeholder="Enter amount (VND)"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          min="10000"
          max="10000000"
          required
        />

        {error && <div className="topup-error">{error}</div>}

        <button 
          className="topup-button" 
          onClick={handleProceed}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Proceed to Payment
        </button>

        <div className="topup-benefits">
          <h4>Benefits</h4>
          <ul>
            <li>✓ Instant balance update</li>
            <li>✓ Secure payment</li>
            <li>✓ No hidden charges</li>
            <li>✓ 24/7 Available</li>
          </ul>
        </div>

        <p className="topup-info">Minimum: 10,000 VND | Maximum: 10,000,000 VND</p>
      </div>
    </div>
  );
};

export default TopUpPage;