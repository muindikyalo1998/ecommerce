
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
mongoose.set('strictPopulate', false);
const mpesaRoutes = require('./routes/mpesa');
app.use('/api/mpesa', mpesaRoutes);
app.use(express.json());
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/mpesa', require('./routes/mpesa'));
app.use("/api/orders", require("./routes/receipt"));


//app.use('/api/mpesa/stkpush', require('./routes/stkpush'));
//app.use('/GET /api/orders/:orderId/receipt', require('./routes/receipt');)

// Server + DB
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
