
const axios = require("axios");

// Load environment variables
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_BUSINESS_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;
const env = process.env.MPESA_ENV || "sandbox";

// Generate timestamp Safaricom format: YYYYMMDDHHMMSS
function generateTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

// Generate OAuth token
async function getAccessToken() {
  try {
    console.log('Getting access token with key:', consumerKey ? '***' + consumerKey.slice(-4) : 'MISSING');
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const url = env === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000
    });

    console.log('Access token received successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

// Generate password
function generatePassword() {
  const timestamp = generateTimestamp();
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

// Initiate STK Push
async function initiateSTKPush(phoneNumber, amount, orderId) {
  try {
    // Validate inputs
    if (!phoneNumber || !amount || !orderId) {
      throw new Error('Missing required parameters: phoneNumber, amount, or orderId');
    }

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      throw new Error('M-Pesa credentials are missing from environment variables');
    }

    console.log('Initiating STK Push with:', {
      phone: phoneNumber,
      amount: amount,
      orderId: orderId,
      shortcode: shortcode
    });

    const token = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword();

    const url = env === "production"
      ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phoneNumber.toString().replace(/^0/, '254'),
      PartyB: shortcode,
      PhoneNumber: phoneNumber.toString().replace(/^0/, '254'),
      CallBackURL: "https://google.com/api/mpesa/callback", // Temporary URL
      AccountReference: `Order-${orderId}`.substring(0, 12),
      TransactionDesc: "Ecommerce payment"
    };

    console.log('STK Push payload:', {
      ...payload,
      Password: '***'
    });

    const response = await axios.post(url, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('STK Push initiated successfully:', response.data);
    return response.data;

  } catch (error) {
    console.error('STK Push Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

// Check payment status
async function checkPaymentStatus(checkoutRequestID) {
  try {
    console.log('🔍 Checking payment status for:', checkoutRequestID);
    
    const token = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword();

    const payload = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    };

    const url = env === 'production' 
      ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });

    console.log('📊 Payment status response:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Payment status check error:', error.response?.data || error.message);
    throw error;
  }
}

// Sandbox simulation (optional)
async function simulateSTKPush(phone, amount, orderId) {
  return {
    status: "SIMULATED",
    message: "STK Push simulated (sandbox mode)",
    phone,
    amount,
    orderId
  };
}

module.exports = {
  initiateSTKPush,
  simulateSTKPush,
  checkPaymentStatus,
  getAccessToken,
  generateTimestamp
};