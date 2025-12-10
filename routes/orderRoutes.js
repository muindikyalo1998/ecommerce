
const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

// GET /api/orders/:id/receipt
router.get("/:id/receipt", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

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
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Total Amount: KSh ${order.totalAmount}`);
    doc.moveDown();
    doc.text("Thank you for your purchase!");

    doc.end();

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ message: "Failed to generate receipt" });
  }
});

module.exports = router;
