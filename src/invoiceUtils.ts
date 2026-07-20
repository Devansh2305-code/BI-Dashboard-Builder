import { Invoice } from "./types";

/**
 * Transforms a raw transaction object into a structured Invoice model.
 */
export function formatTransactionToInvoice(txn: any, currentUser: any): Invoice {
  const rawId = txn.id || `TXN-${Date.now()}`;
  // Extract number sequence or hash for clean Invoice Number e.g. INV-2026-0012
  const shortId = typeof rawId === "string" ? rawId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() : "001";
  const year = new Date(txn.created_at || Date.now()).getFullYear();
  const invoiceNumber = `INV-${year}-${shortId.padStart(4, "0")}`;

  const createdDate = new Date(txn.created_at || Date.now());
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  // Due date = 7 days from creation
  const dueDateObj = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const formattedDueDate = dueDateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const baseAmount = Number(txn.amount) || 0;
  const totalAmount = baseAmount;


  const planCapitalized = txn.plan ? String(txn.plan).toUpperCase() : "CORE";
  const planTitle = planCapitalized === "CORE" 
    ? "Core Plan - Additional Workspace Slot"
    : planCapitalized === "PRIME" 
      ? "Prime Plan Monthly Subscription"
      : planCapitalized === "APEX"
        ? "Apex Plan Annual Enterprise Subscription"
        : `${planCapitalized} Subscription`;

  return {
    id: String(rawId),
    invoiceNumber,
    date: formattedDate,
    dueDate: formattedDueDate,
    customerName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Valued Client",
    customerEmail: currentUser?.email || txn.email || "client@dataglance.com",
    planName: planTitle,
    amount: baseAmount,
    taxAmount: 0,
    totalAmount,
    upiId: txn.upi_id || "N/A",
    transactionRef: txn.transaction_ref || "UTN-SIMULATED",
    status: txn.status === "approved" ? "paid" : txn.status === "pending" ? "pending" : "failed"
  };
}

/**
 * Opens a dedicated printable window formatted as an official tax bill and triggers PDF export.
 */
export function printInvoicePDF(invoice: Invoice) {
  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (!printWindow) {
    alert("Please allow popups for this site to generate the invoice PDF.");
    return;
  }

  const isPaid = invoice.status === "paid" || invoice.status === "approved";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    body {
      background-color: #f8fafc;
      color: #0f172a;
      padding: 40px 20px;
    }

    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }

    .header-table {
      width: 100%;
      margin-bottom: 40px;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .logo-box {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 20px;
    }

    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }

    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-heading {
      font-size: 28px;
      font-weight: 900;
      color: #1e293b;
      letter-spacing: -1px;
      text-transform: uppercase;
    }

    .inv-number {
      font-size: 14px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 4px;
    }

    .status-stamp {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 1px solid;
    }

    .status-paid {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }

    .status-pending {
      background: #fffbebfb;
      color: #d97706;
      border-color: #fde68a;
    }

    .grid-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-block h4 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .info-block p {
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
    }

    .info-block .bold {
      font-weight: 700;
      color: #0f172a;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .items-table th {
      background: #f8fafc;
      text-align: left;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }

    .items-table td {
      padding: 16px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }

    .items-table td.number {
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 600;
    }

    .summary-section {
      width: 300px;
      margin-left: auto;
      margin-bottom: 40px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
      color: #64748b;
    }

    .summary-row.total {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 14px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }

    .footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }

    .no-print-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
    }

    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 20px;
      font-weight: 700;
      font-size: 12px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .btn-print:hover {
      background: #1d4ed8;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 20px 0;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <div>
      <strong>Official Bill PDF Preview</strong> — Invoice ${invoice.invoiceNumber}
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Download PDF / Print</button>
  </div>

  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td>
          <div class="logo-badge">
            <div class="logo-box">DG</div>
            <div>
              <div class="brand-title">DataGlance BI</div>
              <div class="brand-subtitle">Enterprise BI Studio</div>
            </div>
          </div>
        </td>
        <td class="invoice-title">
          <div class="invoice-heading">Invoice</div>
          <div class="inv-number">${invoice.invoiceNumber}</div>
          <div class="status-stamp ${isPaid ? 'status-paid' : 'status-pending'}">
            ${isPaid ? 'PAID & VERIFIED' : 'PAYMENT PENDING'}
          </div>
        </td>
      </tr>
    </table>

    <div class="grid-info">
      <div class="info-block">
        <h4>Billed From</h4>
        <p class="bold">DataGlance Analytics Studio</p>
        <p>Enterprise Technology Hub</p>
        <p>support@dataglance.com</p>
      </div>


      <div class="info-block">
        <h4>Billed To</h4>
        <p class="bold">${invoice.customerName}</p>
        <p>${invoice.customerEmail}</p>
        <p>UPI ID: ${invoice.upiId}</p>
      </div>

      <div class="info-block" style="text-align: right;">
        <h4>Invoice Details</h4>
        <p><strong>Issue Date:</strong> ${invoice.date}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
        <p><strong>Ref Code:</strong> ${invoice.transactionRef}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${invoice.planName}</strong>
            <br>
            <span style="font-size: 11px; color: #64748b;">Enterprise Workspace Capacity & AI Narrative Analysis License</span>
          </td>
          <td>1</td>
          <td>Rs. ${invoice.amount.toLocaleString()}</td>
          <td class="number">Rs. ${invoice.amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-section">
      <div class="summary-row total">
        <span>Total Amount</span>
        <span>Rs. ${invoice.totalAmount.toLocaleString()}</span>
      </div>
    </div>


    <div class="footer">
      <div>Thank you for choosing DataGlance BI Studio!</div>
      <div>Computer-generated invoice. No signature required.</div>
    </div>
  </div>

  <script>
    // Automatically trigger print popup after rendering
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
