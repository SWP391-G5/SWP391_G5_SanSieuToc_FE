import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import qrImage from '../../assets/images/qr-vietqr.png';
import Toast from '../../components/Toast';
import '../../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('banking');
  const [paypalReady, setPaypalReady] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [toast, setToast] = useState(null);

  const amount = location.state?.amount || 0;

  // Load PayPal SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=AQVLnL9xIJmQJr3YPvvWZJN-9BkE3J2CMmhGFJCR_D5P4SYUXVwTQ2cJ5wQ1h2qXN9Pp-V5j1cJPKVqG&currency=USD';
    script.async = true;
    script.onload = () => {
      console.log('PayPal SDK loaded');
      setPaypalReady(true);
    };
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      setPaypalReady(false);
      setError('PayPal service unavailable. Please use Bank Transfer or enter card details.');
    };
    document.body.appendChild(script);
  }, []);

  // Render PayPal button when ready and PayPal is selected
  useEffect(() => {
    if (paypalReady && paymentMethod === 'paypal' && window.paypal && amount > 0) {
      // Clear previous button if exists
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }

      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: (amount / 24000).toFixed(2), // Convert VND to USD (approximate)
              },
              description: 'San Sieu Toc - Wallet Top-up',
            }],
          });
        },
        onApprove: async (data, actions) => {
          try {
            const order = await actions.order.capture();
            console.log('Order captured:', order);
            
            // Call backend to confirm payment
            const token = auth.accessToken || localStorage.getItem('accessToken');
            const response = await fetch('/api/wallets/topup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: parseFloat(amount),
                transactionID: order.id,
                paymentMethod: 'paypal',
              }),
            });

            const data = await response.json();
            if (data.success) {
              setToast({
                message: `PayPal Payment successful! New balance: ${parseInt(data.data.wallet.balance).toLocaleString('vi-VN')} VND`,
                type: 'success'
              });
              setTimeout(() => navigate('/profile', { state: { refreshWallet: true } }), 2000);
            } else {
              setError(data.message || 'Transaction failed');
            }
          } catch (err) {
            console.error('Error:', err);
            setError('Payment processing failed');
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          setError('PayPal payment cancelled or failed');
        },
      }).render('#paypal-button-container');
    }
  }, [paypalReady, paymentMethod, amount, auth.accessToken, navigate]);

  if (!amount || amount <= 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h2>Invalid amount</h2>
          <button onClick={() => navigate('/top-up')}>Back to Top Up</button>
        </div>
      </div>
    );
  }

  const handlePaymentConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const token = auth.accessToken || localStorage.getItem('accessToken');
      
      const response = await fetch('/api/wallets/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          transactionID: `TXN-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: `Top-up successful! New balance: ${parseInt(data.data.wallet.balance).toLocaleString('vi-VN')} VND`,
          type: 'success'
        });
        setTimeout(() => navigate('/profile', { state: { refreshWallet: true } }), 2000);
      } else {
        setError(data.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateCardForm = () => {
    if (!cardInfo.cardNumber || !cardInfo.cardName || !cardInfo.expiryDate || !cardInfo.cvv) {
      setError('Please fill in all card details');
      return false;
    }

    const namePattern = /^[^.,;]+$/;
    if (!namePattern.test(cardInfo.cardName)) {
      setError('Cardholder name cannot contain special characters (. , ;)');
      return false;
    }

    const expiryParts = cardInfo.expiryDate.split('/');
    if (expiryParts.length !== 2) {
      setError('Invalid expiry date format (use MM/YY)');
      return false;
    }
    const month = parseInt(expiryParts[0], 10);
    const year = parseInt('20' + expiryParts[1], 10);
    if (month < 1 || month > 12) {
      setError('Month must be between 01 and 12');
      return false;
    }
    if (year < 2027) {
      setError('Year must be 27 or later');
      return false;
    }

    if (cardInfo.cvv.length < 3 || cardInfo.cvv.length > 4) {
      setError('CVV must be 3 or 4 digits');
      return false;
    }

    setError('');
    return true;
  };

  const handleCardPayment = async () => {
    if (!validateCardForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = auth.accessToken || localStorage.getItem('accessToken');
      
      const response = await fetch('/api/wallets/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          transactionID: `TXN-${Date.now()}`,
          paymentMethod: 'card',
          cardLast4: cardInfo.cardNumber.slice(-4),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: `Payment successful! New balance: ${parseInt(data.data.wallet.balance).toLocaleString('vi-VN')} VND`,
          type: 'success'
        });
        setTimeout(() => navigate('/profile', { state: { refreshWallet: true } }), 2000);
      } else {
        setError(data.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const qrData = JSON.stringify({
    amount: amount,
    transactionId: `TXN-${Date.now()}`,
    userId: auth.user?.id,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="checkout-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h1>Payment Confirmation</h1>
      <div className="checkout-container">
        <div className="checkout-left">
          <div className="amount-display">
            <h2>Amount to Pay</h2>
            <div className="amount-value">{amount.toLocaleString('vi-VN')} VND</div>
          </div>
          
          {paymentMethod === 'banking' && (
            <div className="qr-section">
              <h3>Scan QR Code to Pay</h3>
              <div className="qr-container">
                <img 
                  src={qrImage}
                  alt="VietQR Payment"
                  className="qr-image"
                />
              </div>
              <p className="qr-info">Use your banking app to scan and complete payment</p>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="paypal-section">
              <h3>PayPal Payment</h3>
              <div className="paypal-container">
                {paypalReady && window.paypal ? (
                  <div id="paypal-button-container" className="paypal-button"></div>
                ) : (
                  <div className="card-form">
                    <h4>Enter Card Details</h4>
                    <input
                      type="text"
                      placeholder="Card Number (16 digits)"
                      maxLength="16"
                      value={cardInfo.cardNumber}
                      onChange={(e) => setCardInfo({...cardInfo, cardNumber: e.target.value.replace(/\D/g, '')})}
                      className="card-input"
                    />
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={cardInfo.cardName}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[.,;]/g, '');
                        setCardInfo({...cardInfo, cardName: value});
                      }}
                      className="card-input"
                    />
                    <div className="card-row">
                      <div>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          value={cardInfo.expiryDate}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length >= 2) {
                              let mm = parseInt(val.slice(0, 2), 10);
                              if (mm > 12) mm = 1;
                              if (mm < 1) mm = 1;
                              val = mm.toString().padStart(2, '0') + '/' + val.slice(2, 4);
                            }
                            if (val.length === 5) {
                              let yy = parseInt(val.slice(3, 5), 10);
                              if (yy < 27) yy = 27;
                              val = val.slice(0, 3) + yy.toString();
                            }
                            setCardInfo({...cardInfo, expiryDate: val});
                          }}
                          className="card-input"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="CVV"
                          maxLength="4"
                          value={cardInfo.cvv}
                          onChange={(e) => setCardInfo({...cardInfo, cvv: e.target.value.replace(/\D/g, '')})}
                          className="card-input"
                        />
                      </div>
                    </div>
                    <button 
                      className="confirm-button"
                      onClick={handleCardPayment}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Pay with Card'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="checkout-right">
          <div className="payment-methods">
            <h3>Payment Methods</h3>
            
            <div className="method">
              <input 
                type="radio" 
                id="banking" 
                name="method" 
                value="banking"
                checked={paymentMethod === 'banking'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <label htmlFor="banking">
                <span className="method-icon">🏦</span>
                <span className="method-name">Bank Transfer (QR Code)</span>
              </label>
            </div>

            <div className="method">
              <input 
                type="radio" 
                id="paypal" 
                name="method" 
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <label htmlFor="paypal">
                <span className="method-icon">₽</span>
                <span className="method-name">PayPal</span>
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            {paymentMethod === 'banking' && (
              <>
                <button 
                  className="confirm-button"
                  onClick={handlePaymentConfirm}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>

                <button 
                  className="cancel-button"
                  onClick={() => navigate('/top-up')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </>
            )}

            {paymentMethod === 'paypal' && (
              <button 
                className="cancel-button"
                onClick={() => navigate('/top-up')}
              >
                Cancel
              </button>
            )}

            <div className="payment-info">
              <h4>Payment Details</h4>
              <p><strong>Amount:</strong> {amount.toLocaleString('vi-VN')} VND</p>
              <p><strong>Type:</strong> Wallet Top-up</p>
              <p><strong>Status:</strong> Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;