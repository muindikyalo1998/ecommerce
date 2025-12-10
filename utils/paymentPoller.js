
const Order = require('../models/Order');
const { checkPaymentStatus } = require('./mpesa');

// Store active polling intervals
const activePolls = new Map();

async function startPaymentPolling(orderId, checkoutRequestID) {
  console.log(`🚀 Starting payment polling for order: ${orderId}`);
  
  const maxAttempts = 30; // 5 minutes (10-second intervals)
  let attempts = 0;

  const pollInterval = setInterval(async () => {
    try {
      attempts++;
      
      // Update attempt count in database
      await Order.findByIdAndUpdate(orderId, {
        pollingAttempts: attempts
      });

      console.log(`🔄 Polling attempt ${attempts} for order: ${orderId}`);
      
      const statusResponse = await checkPaymentStatus(checkoutRequestID);
      
      // ResultCode meanings:
      // 0 = Success
      // 1 = Insufficient funds
      // 1032 = Request processing (still waiting)
      // Other codes = Various failures
      
      if (statusResponse.ResultCode === '0') {
        // ✅ Payment successful!
        console.log(`✅ Payment SUCCESS for order: ${orderId}`);
        clearInterval(pollInterval);
        activePolls.delete(orderId);
        
        await Order.findByIdAndUpdate(orderId, {
          status: 'paid',
          paymentStatus: 'success',
          mpesaTransactionCode: statusResponse.MpesaReceiptNumber
        });
        
      } else if (statusResponse.ResultCode === '1032') {
        // ⏳ Still processing, continue polling
        console.log(`⏳ Payment still processing for order: ${orderId}`);
        
      } else {
        // ❌ Payment failed
        console.log(`❌ Payment FAILED for order: ${orderId}. Code: ${statusResponse.ResultCode}`);
        clearInterval(pollInterval);
        activePolls.delete(orderId);
        
        await Order.findByIdAndUpdate(orderId, {
          status: 'payment_failed',
          paymentStatus: 'failed'
        });
      }

      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        console.log(`⏰ Polling timeout for order: ${orderId}`);
        clearInterval(pollInterval);
        activePolls.delete(orderId);
        
        await Order.findByIdAndUpdate(orderId, {
          status: 'payment_timeout',
          paymentStatus: 'timeout'
        });
      }
      
    } catch (error) {
      console.error(`❌ Polling error for order ${orderId}:`, error.message);
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        activePolls.delete(orderId);
      }
    }
  }, 10000); // Check every 10 seconds

  // Store the interval so we can clear it if needed
  activePolls.set(orderId, pollInterval);
}

function stopPaymentPolling(orderId) {
  if (activePolls.has(orderId)) {
    clearInterval(activePolls.get(orderId));
    activePolls.delete(orderId);
    console.log(`🛑 Stopped polling for order: ${orderId}`);
  }
}

module.exports = {
  startPaymentPolling,
  stopPaymentPolling,
  activePolls
};