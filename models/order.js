const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: String,
    color: String,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'paid', 'confirmed', 'delivered', 'payment_failed', 'payment_timeout'],
    default: 'pending'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mpesa', 'bank_transfer']
  },
  checkoutRequestID: String,
  merchantRequestID: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed', 'timeout'],
    default: 'pending'
  },
  mpesaReceiptNumber: String,
  mpesaTransactionDate: String,
  pollingAttempts: {
    type: Number,
    default: 0
  },
  maxPollingAttempts: {
    type: Number,
    default: 20
  }
}, {
  timestamps: true
});

// Add index for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ checkoutRequestID: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);