
const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Order = require("../models/order");

// GET /api/orders/:orderId/receipt
router.get("/:orderId/receipt", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${order._id}.pdf`
    );

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(20).text("Order Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Amount Paid: KSh ${order.totalAmount}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    doc.text("Thank you for shopping with us!");

    doc.end();

  } catch (err) {
    console.error("Receipt error:", err);
    res.status(500).json({ message: "Could not generate receipt" });
  }
});

module.exports = router;
