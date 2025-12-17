const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const auth = require('../middleware/auth');

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      phoneNumber,
      shippingAddress,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Items are required and must be a non-empty array' 
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
      return res.status(400).json({ 
        success: false,
        error: 'Complete shipping address is required' 
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({ 
          success: false,
          error: 'Each item must have a product ID' 
        });
      }
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          success: false,
          error: `Product not found: ${item.product}` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          error: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
        image: product.images?.[0] || ''
      });
    }

    // Create the order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      phoneNumber,
      shippingAddress,
      paymentMethod,
      status: 'pending_payment',
      paymentStatus: 'pending'
    });

    await order.save();

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name price images stock');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images category');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Payment Status Check Route
router.get('/:id/payment-status', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price images');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Check if user owns the order
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Return comprehensive payment status information
    const statusResponse = {
      success: true,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      orderId: order._id,
      totalAmount: order.totalAmount,
      checkoutRequestID: order.checkoutRequestID,
      merchantRequestID: order.merchantRequestID,
      mpesaReceiptNumber: order.mpesaReceiptNumber,
      pollingAttempts: order.pollingAttempts,
      order: order
    };

    // Add specific messages based on payment status
    switch (order.paymentStatus) {
      case 'success':
        statusResponse.message = 'Payment completed successfully';
        statusResponse.nextAction = 'Your order is being processed';
        break;
      case 'failed':
        statusResponse.message = 'Payment failed. Please try again.';
        statusResponse.nextAction = 'Retry payment or contact support';
        break;
      case 'timeout':
        statusResponse.message = 'Payment timeout. Please check your M-Pesa messages.';
        statusResponse.nextAction = 'Check your phone and refresh status';
        break;
      case 'pending':
        statusResponse.message = 'Payment is pending. Waiting for M-Pesa confirmation.';
        statusResponse.nextAction = 'Please complete the payment on your phone';
        break;
      default:
        statusResponse.message = 'Payment status unknown';
        statusResponse.nextAction = 'Please contact support';
    }

    res.json(statusResponse);

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status',
      details: error.message
    });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, paymentStatus, mpesaReceiptNumber, mpesaTransactionDate, checkoutRequestID, merchantRequestID } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (mpesaReceiptNumber) updates.mpesaReceiptNumber = mpesaReceiptNumber;
    if (mpesaTransactionDate) updates.mpesaTransactionDate = mpesaTransactionDate;
    if (checkoutRequestID) updates.checkoutRequestID = checkoutRequestID;
    if (merchantRequestID) updates.merchantRequestID = merchantRequestID;

    // Increment polling attempts if checking status
    if (paymentStatus === 'pending') {
      updates.pollingAttempts = (order.pollingAttempts || 0) + 1;
    }

    // If payment is successful, update product stock and order status
    if (paymentStatus === 'success' && order.paymentStatus !== 'success') {
      updates.status = 'paid';
      
      // Update product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }
    }

    // If payment failed, update order status
    if (paymentStatus === 'failed' && order.paymentStatus !== 'failed') {
      updates.status = 'payment_failed';
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('user', 'name email')
    .populate('items.product', 'name price images');

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
      details: error.message
    });
  }
});

// Get user's orders
router.get('/user/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Update payment status (for webhook or manual updates)
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, mpesaReceiptNumber, mpesaTransactionDate } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Only allow admin or the system to update payment status
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Admin privileges required.' 
      });
    }

    const updateData = { paymentStatus };
    if (mpesaReceiptNumber) updateData.mpesaReceiptNumber = mpesaReceiptNumber;
    if (mpesaTransactionDate) updateData.mpesaTransactionDate = mpesaTransactionDate;

    // Update order status based on payment status
    if (paymentStatus === 'success') {
      updateData.status = 'paid';
      
      // Update product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }
    } else if (paymentStatus === 'failed') {
      updateData.status = 'payment_failed';
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('items.product', 'name price');

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
});

module.exports = router;