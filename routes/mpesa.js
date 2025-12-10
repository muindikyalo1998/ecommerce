const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const axios = require('axios');
const moment = require('moment');

// ADD THIS LINE - This fixes the req.body issue
router.use(express.json());

// M-Pesa STK Push initiation
router.post('/stk-push', auth, async (req, res) => {
  try {
    console.log('Received M-Pesa request body:', req.body);

    // Safe destructuring with null check
    const { orderId, phoneNumber, amount } = req.body || {};

    // Validate required fields
    if (!orderId || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, phone number, and amount are required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // M-Pesa credentials from environment variables
    const businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!businessShortCode || !passkey || !consumerKey || !consumerSecret) {
      return res.status(500).json({
        success: false,
        error: 'M-Pesa configuration missing'
      });
    }

    // Generate timestamp and password
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    // Get access token
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // STK Push request
    const stkPushResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: businessShortCode,
        PhoneNumber: phoneNumber,
        //CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback`,
        CallBackURL: `https://nonpunitory-nondependably-sawyer.ngrok-free.dev/api/mpesa/callback`,
        AccountReference: `ORDER-${orderId}`,
        TransactionDesc: `Payment for order ${orderId}`
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const responseData = stkPushResponse.data;

    if (responseData.ResponseCode === '0') {
      // Update order with checkout request ID
      await Order.findByIdAndUpdate(orderId, {
        checkoutRequestID: responseData.CheckoutRequestID,
        merchantRequestID: responseData.MerchantRequestID,
        paymentStatus: 'pending'
      });

      res.json({
        success: true,
        message: 'M-Pesa prompt sent to your phone',
        checkoutRequestID: responseData.CheckoutRequestID,
        merchantRequestID: responseData.MerchantRequestID
      });
    } else {
      throw new Error(responseData.ResponseDescription || 'M-Pesa request failed');
    }

  } catch (error) {
    console.error('M-Pesa STK Push error:', error.response?.data || error.message);
    
    // Safe error handling
    const orderId = req.body?.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed',
        status: 'payment_failed'
      });
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.errorMessage || error.response?.data?.ResponseDescription || 'M-Pesa payment initiation failed'
    });
  }
});

// M-Pesa callback handler (for Safaricom webhooks)
router.post('/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    if (callbackData.Body.stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      const amount = metadata.find(item => item.Name === 'Amount').Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber').Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate').Value;

      // Find order by checkout request ID
      const order = await Order.findOne({
        checkoutRequestID: callbackData.Body.stkCallback.CheckoutRequestID
      });

      if (order) {
        // Update order with payment details
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'success',
          status: 'paid',
          mpesaReceiptNumber: mpesaReceiptNumber,
          mpesaTransactionDate: transactionDate
        });

        console.log(`Payment successful for order ${order._id}, Receipt: ${mpesaReceiptNumber}`);
      }
    } else {
      // Payment failed
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const order = await Order.findOne({
        checkoutRequestID: callbackData.Body.stkCallback.CheckoutRequestID
      });

      if (order) {
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'failed',
          status: 'payment_failed'
        });

        console.log(`Payment failed for order ${order._id}: ${resultDesc}`);
      }
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// Check payment status
router.get('/payment-status/:checkoutRequestID', auth, async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    const order = await Order.findOne({ checkoutRequestID })
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      mpesaReceiptNumber: order.mpesaReceiptNumber,
      order: order
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status'
    });
  }
});

module.exports = router;