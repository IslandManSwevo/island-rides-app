import { Receipt } from './receiptService';
import { colors } from '../styles/theme';


// Helper function to safely format dates with null/undefined checks
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Helper function to safely format currency with null/undefined checks
const formatCurrency = (amount: number | null | undefined, currency: string = 'USD') => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return '$0.00';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numericAmount);
  } catch (error) {    
    return `$${numericAmount.toFixed(2)}`;
  }
};

// Helper function to safely escape HTML
const escapeHtml = (text: string | null | undefined) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getStyles = () => `
<style>
    body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: ${colors.sectionBackground};
        color: ${colors.text};
    }
    .receipt-container {
        max-width: 600px;
        margin: 0 auto;
        background: ${colors.white};
        border-radius: 8px;
        box-shadow: 0 2px 10px ${colors.shadow}1A;
        overflow: hidden;
    }
    .header {
        background: ${colors.primary};
        color: ${colors.white};
        padding: 30px;
        text-align: center;
    }
    .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 300;
    }
    .header p {
        margin: 5px 0 0 0;
        opacity: 0.9;
    }
    .content {
        padding: 30px;
    }
    .section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid ${colors.lightBorder};
    }
    .section:last-child {
        border-bottom: none;
        margin-bottom: 0;
    }
    .section-title {
        font-size: 18px;
        font-weight: 600;
        color: ${colors.primary};
        margin-bottom: 15px;
    }
    .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        align-items: center;
    }
    .detail-label {
        color: ${colors.grey};
        font-weight: 500;
    }
    .detail-value {
        font-weight: 600;
        text-align: right;
    }
    .total-amount {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        margin-top: 10px;
    }
    .total-amount .detail-value {
        font-size: 20px;
        color: #007AFF;
    }
    .vehicle-info {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        text-align: center;
    }
    .vehicle-name {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 5px;
    }
    .vehicle-location {
        color: #666;
    }
    .footer {
        text-align: center;
        color: ${colors.grey};
        font-size: 12px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid ${colors.lightBorder};
    }
    @media print {
        body { margin: 0; background: ${colors.white}; }
        .receipt-container { box-shadow: none; }
    }
</style>
`;

interface CompanyData {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface BookingData {
    id: number | string;
    startDate: string;
    endDate: string;
    duration: number;
    totalAmount: number;
}

interface VehicleData {
    make: string;
    model: string;
    year: number;
    location: string;
    dailyRate: number;
}

interface CustomerData {
    firstName: string;
    lastName: string;
    email: string;
}

interface PaymentData {
    transactionId: string;
    date: string;
    method: string;
    currency: string;
}

const generateHeader = (company: CompanyData) => `
<div class="header">
    <h1>${escapeHtml(company.name)}</h1>
    <p>${escapeHtml(company.address)}</p>
    <p>${escapeHtml(company.phone)} • ${escapeHtml(company.email)}</p>
</div>
`;

const generatePaymentDetails = (booking: BookingData, payment: PaymentData) => `
<div class="section">
    <div class="section-title">Payment Receipt</div>
    <div class="detail-row">
        <span class="detail-label">Receipt #:</span>
        <span class="detail-value">${escapeHtml(typeof booking.id === 'number' ? booking.id.toString().padStart(6, '0') : booking.id)}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Transaction ID:</span>
        <span class="detail-value">${escapeHtml(payment.transactionId)}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Payment Date:</span>
        <span class="detail-value">${escapeHtml(formatDate(payment.date))}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Payment Method:</span>
        <span class="detail-value">${escapeHtml(payment.method)}</span>
    </div>
</div>
`;

const generateCustomerInfo = (customer: CustomerData) => `
<div class="section">
    <div class="section-title">Customer Information</div>
    <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${escapeHtml(customer.email)}</span>
    </div>
</div>
`;

const generateVehicleDetails = (vehicle: VehicleData, booking: BookingData, payment: PaymentData) => `
<div class="section">
    <div class="section-title">Vehicle & Rental Details</div>
    <div class="vehicle-info">
        <div class="vehicle-name">${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)} ${escapeHtml(vehicle.year?.toString())}</div>
        <div class="vehicle-location">📍 ${escapeHtml(vehicle.location)}</div>
    </div>
    <br>
    <div class="detail-row">
        <span class="detail-label">Rental Start:</span>
        <span class="detail-value">${formatDate(booking.startDate)}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Rental End:</span>
        <span class="detail-value">${formatDate(booking.endDate)}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Duration:</span>
        <span class="detail-value">${booking.duration} day${booking.duration !== 1 ? 's' : ''}</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Daily Rate:</span>
        <span class="detail-value">${formatCurrency(vehicle.dailyRate, payment.currency)}</span>
    </div>
</div>
`;

const generatePaymentSummary = (booking: BookingData, vehicle: VehicleData, payment: PaymentData) => `
<div class="section">
    <div class="section-title">Payment Summary</div>
    <div class="detail-row">
        <span class="detail-label">Subtotal (${booking.duration} × ${formatCurrency(vehicle.dailyRate, payment.currency)}):</span>
        <span class="detail-value">${formatCurrency(booking.duration * vehicle.dailyRate, payment.currency)}</span>
    </div>
    <div class="total-amount">
        <div class="detail-row">
            <span class="detail-label"><strong>Total Paid:</strong></span>
            <span class="detail-value">${formatCurrency(booking.totalAmount, payment.currency)}</span>
        </div>
    </div>
</div>
`;

const generateFooter = (company: CompanyData) => `
<div class="footer">
    <p>Thank you for choosing ${escapeHtml(company.name)}!</p>
    <p>Questions? Contact us at ${escapeHtml(company.email)} or ${escapeHtml(company.phone)}</p>
</div>
`;

export const generateReceiptHTML = (receipt: Receipt): string => {
    const { booking, vehicle, customer, payment, company } = receipt || {};

    // Safe data extraction with fallbacks
    const safeBooking = {
      id: booking?.id ?? 'N/A',
      duration: booking?.duration || 0,
      startDate: booking?.startDate,
      endDate: booking?.endDate,
      totalAmount: booking?.totalAmount || 0,
      createdAt: booking?.createdAt
    };

    const safeVehicle = {
      make: escapeHtml(vehicle?.make) || 'Unknown',
      model: escapeHtml(vehicle?.model) || 'Vehicle',
      year: vehicle?.year,
      location: escapeHtml(vehicle?.location) || 'Unknown Location',
      dailyRate: vehicle?.dailyRate || 0
    };

    const safeCustomer = {
      firstName: escapeHtml(customer?.firstName) || 'Valued',
      lastName: escapeHtml(customer?.lastName) || 'Customer',
      email: escapeHtml(customer?.email) || 'N/A'
    };

    const safePayment = {
      transactionId: escapeHtml(payment?.transactionId) || 'N/A',
      method: escapeHtml(payment?.method) || 'N/A',
      date: payment?.date || safeBooking.createdAt,
      currency: payment?.currency || 'USD'
    };

    const safeCompany = {
      name: escapeHtml(company?.name) || 'KeyLo',
      address: escapeHtml(company?.address) || 'Bahamas',
      phone: escapeHtml(company?.phone) || 'N/A',
      email: escapeHtml(company?.email) || 'info@keylo.com'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Receipt - ${safeCompany.name}</title>
        ${getStyles()}
    </head>
    <body>
        <div class="receipt-container">
            ${generateHeader(safeCompany)}
            <div class="content">
                ${generatePaymentDetails(safeBooking, safePayment)}
                ${generateCustomerInfo(safeCustomer)}
                ${generateVehicleDetails(safeVehicle, safeBooking, safePayment)}
                ${generatePaymentSummary(safeBooking, safeVehicle, safePayment)}
                ${generateFooter(safeCompany)}
            </div>
        </div>
    </body>
    </html>
    `;
};