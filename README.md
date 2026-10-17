<div align="center">
  <img src="https://github.com/kenandarabeh/sofizpay-sdk/blob/main/assets/sofizpay-logo.png?raw=true" alt="SofizPay Logo" width="200" />

  <h2>SofizPay JavaScript SDK</h2>
  <p><strong>The official JavaScript/TypeScript SDK for secure digital payments on the SofizPay platform.</strong></p>

  [![npm version](https://badge.fury.io/js/sofizpay-sdk-js.svg)](https://www.npmjs.com/package/sofizpay-sdk)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [What's New in v1.1.11](#-whats-new-in-v1111)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Methods](#core-methods)
- [API Reference](#api-reference)
- [Digital Services (Missions)](#digital-services-missions)
- [Bank Integration (CIB & EDAHABIA)](#-bank-integration-cib--edahabia)
- [Sandbox Environment & Mock Cards](#-sandbox-environment--mock-cards)
- [Webhooks & Signature Verification](#-webhooks--signature-verification)
- [Return URL vs. Webhook Notifications](#-return-url-vs-webhook-notifications)
- [Testing & Sandbox Validation](#-testing--sandbox-validation)
- [Real-time Transaction Streaming](#real-time-transaction-streaming)
- [Response Format](#response-format)
- [Security Best Practices](#security-best-practices)
- [Support](#support)

---

## 🌟 Overview

The SofizPay JS SDK is a full-featured library for integrating **DZT digital payments** into any JavaScript environment — **Node.js**, **React**, **Vue**, **Next.js**, or plain **Browser**. It provides a clean async API for on-chain Stellar payments, exhaustive transaction history, CIB bank deposits, digital service recharges (Missions), and automated webhook signature verification.

**Key Benefits:**
- ⚡ `async/await` API — clean, predictable, no callback hell
- 🌍 Works anywhere: Node.js, Next.js, React, Vue, and browsers (UMD/CDN)
- 🧪 Dedicated Sandbox simulation mode with mock cards & OTP testing
- 🔔 Asynchronous server-to-server Webhook callbacks (`cib.payment.updated`)
- 🔐 Built-in cryptographic RSA SHA-256 signature verification
- 🏦 SATIM CIB / EDAHABIA bank deposit links & order tracking
- 📊 Exhaustive 24-transaction history (Path Payments, Trustlines, Account Creation)
- 🔴 Real-time transaction streaming with configurable intervals
- 📱 Phone, Internet & Game recharges (Mission APIs)

---

## 🆕 What's New in v1.1.11

SofizPay JS SDK v1.1.11 brings full official support for **Sandbox Bank Simulations** and **Real-Time Asynchronous Webhooks**:

| Feature | Details | Status |
|---------|---------|--------|
| **🧪 Sandbox Mode** | Complete test mode simulating SATIM CIB/EDAHABIA gateway. Initialize via `new SofizPaySDK(true)` or call `makeSandboxCIBTransaction()`. | ✅ New |
| **💳 Mock Cards Suite** | 6 preconfigured test cards (Approved cards with OTP `123456`, Declined, Insufficient funds, Expired, and Timeout). | ✅ New |
| **🔔 Webhooks Integration** | Server-to-server HTTP POST notifications (`cib.payment.updated`) automatically sent to your `webhook_url` upon payment completion. | ✅ New |
| **🔐 RSA Signature Verification** | Native `verifyWebhookSignature(payload)` helper to cryptographically authenticate SofizPay webhooks using the official public key. | ✅ New |
| **⚙️ Extended Parameters** | Support for `webhook_url`, `invoice_id`, `language` (`'ar'`, `'fr'`, `'en'`), and `keep_return_url` in CIB requests. | ✅ Enhanced |
| **📊 Status Checking** | Dedicated `checkSandboxCIBStatus(id)` alongside production `checkCIBStatus(id)`. | ✅ New |
| **📘 TypeScript Definitions** | Full typings for `WebhookPayload`, `CIBTransactionData`, and `CIBTransactionResult` in `index.d.ts`. | ✅ Enhanced |
| **🧪 Built-in Test Suite** | Ready-to-run automated test scripts: `npm test` and `npm run test:sandbox`. | ✅ New |

---

## 📦 Installation

### npm / yarn

```bash
npm install sofizpay-sdk-js
# or
yarn add sofizpay-sdk-js
```

### Browser (CDN)

Load the following scripts in order before the SDK:

```html
<script src="https://unpkg.com/stellar-sdk@12.3.0/dist/stellar-sdk.min.js"></script>
<script src="https://unpkg.com/axios@1.10.0/dist/axios.min.js"></script>
<script src="https://unpkg.com/sofizpay-sdk-js@latest/dist/sofizpay-sdk.umd.js"></script>
```

---

## 🚀 Quick Start

```javascript
import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK();

// 1. Check DZT balance
const balance = await sdk.getBalance('YOUR_PUBLIC_KEY');
if (balance.success) {
  console.log(`💰 Balance: ${balance.balance} DZT`);
}

// 2. Send a DZT payment
const result = await sdk.submit({
  secretkey:            'YOUR_SECRET_KEY',
  destinationPublicKey: 'RECIPIENT_PUBLIC_KEY',
  amount:               100,
  memo:                 'Invoice #1234'
});

if (result.success) {
  console.log(`✅ Payment sent! TX: ${result.transactionId}`);
} else {
  console.error(`❌ Failed: ${result.error}`);
}
```

---

## 🔧 Core Methods

### `getBalance(publicKey)`

Returns the current **DZT** balance for a given Stellar account.

```javascript
const result = await sdk.getBalance('GCAZI...YOUR_PUBLIC_KEY');

// Response
{
  success:      true,
  balance:      '1500.0000000',
  publicKey:    'GCAZI...',
  asset_code:   'DZT',
  asset_issuer: 'GCAZI7YBLIDJWIVEL7ETNAZGPP3LC24NO6KAOBWZHUERXQ7M5BC52DLV',
  timestamp:    '2025-07-28T10:30:00.000Z'
}
```

---

### `submit(data)`

Submits a DZT payment to the Stellar network.

```javascript
const result = await sdk.submit({
  secretkey:            'SXXX...YOUR_SECRET',         // 56-char Stellar seed starting with 'S'
  destinationPublicKey: 'GXXX...RECIPIENT',            // Recipient's public key
  amount:               250.50,                        // Amount in DZT
  memo:                 'Order #5567'                  // Optional memo (max 28 chars)
});

// Success Response
{
  success:            true,
  transactionId:      'abc123...hash',
  transactionHash:    'abc123...hash',
  amount:             '250.50',
  memo:               'Order #5567',
  destinationPublicKey: 'GXXX...',
  timestamp:          '2025-07-28T10:30:00.000Z'
}
```

> ⚠️ **Memo Truncation:** Memos longer than 28 characters are automatically truncated.

---

### `getTransactions(publicKey, limit)`

Fetches **exhaustive transaction history** via the Stellar `/operations?join=transactions` endpoint. This ensures that all four operation types are captured.

```javascript
const history = await sdk.getTransactions('YOUR_PUBLIC_KEY', 100);

if (history.success) {
  history.transactions.forEach(tx => {
    console.log(`[${tx.timestamp}] ${tx.type.toUpperCase()} — ${tx.amount} ${tx.asset_code || 'DZT'}`);
  });
}

// Each transaction object:
{
  id:          'transaction_hash',
  hash:        'transaction_hash',
  type:        'sent' | 'received' | 'trustline' | 'account_created',
  amount:      '100.0000000',
  from:        'GXXX...sender',
  to:          'GXXX...recipient',
  asset_code:  'DZT',
  memo:        'Payment memo',
  timestamp:   '2025-07-28T10:30:00.000Z',
  successful:  true
}
```

**Captured transaction types:**

| Type | Description |
|------|-------------|
| `sent` | DZT payment sent from this account |
| `received` | DZT payment received by this account |
| `trustline` | DZT trustline created (account activation) |
| `account_created` | Account creation / initial funding |

---

### `getPublicKey(secretKey)`

Derives the Stellar public key from a secret key without making any network calls.

```javascript
const result = await sdk.getPublicKey('SXXX...YOUR_SECRET_KEY');
if (result.success) {
  console.log('Public key:', result.publicKey);
}
```

---

### `searchTransactionsByMemo(publicKey, memo, limit)`

Performs a case-insensitive substring search over a user's recent transactions.

```javascript
const results = await sdk.searchTransactionsByMemo('YOUR_PUBLIC_KEY', 'Order #12345', 10);
if (results.success) {
  console.log(`Found ${results.transactions.length} matching transactions`);
}
```

---

### `getTransactionByHash(hash)`

Fetches a single transaction object by its hash.

```javascript
const tx = await sdk.getTransactionByHash('abc123...hash');
if (tx.success && tx.found) {
  console.log('Amount:', tx.transaction.amount);
} else {
  console.log('Transaction not found');
}
```

---

## 📚 API Reference

### Full Method Table

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `submit(data)` | `{secretkey, destinationPublicKey, amount, memo?}` | `PaymentResult` | Submit DZT payment |
| `getBalance(publicKey)` | `string` | `BalanceResult` | Get DZT balance |
| `getPublicKey(secretKey)` | `string` | `PublicKeyResult` | Derive public key from secret |
| `getTransactions(publicKey, limit?)` | `string, number` | `TransactionsResult` | Full transaction history |
| `getTransactionByHash(hash)` | `string` | `TransactionResult` | Find specific transaction |
| `searchTransactionsByMemo(publicKey, memo, limit?)` | `string, string, number` | `TransactionsResult` | Search by memo |
| `startTransactionStream(publicKey, callback, fromNow?, interval?)` | See streaming section | `StreamResult` | Start real-time monitoring |
| `stopTransactionStream(publicKey)` | `string` | `StreamResult` | Stop monitoring |
| `getStreamStatus(publicKey)` | `string` | `StreamStatusResult` | Check stream status |
| `makeCIBTransaction(data)` | See CIB section | `CIBResult` | Create bank payment link (Prod / Sandbox) |
| `makeSandboxCIBTransaction(data)` | See CIB section | `CIBResult` | Create sandbox bank payment link |
| `checkCIBStatus(cibTransactionId, isSandbox?)` | `string, boolean?` | `ServiceResult` | Check CIB order status |
| `checkSandboxCIBStatus(cibTransactionId)` | `string` | `ServiceResult` | Check sandbox CIB order status |
| `verifyWebhookSignature(payload)` | `WebhookPayload` | `boolean` | Verify RSA SHA-256 webhook signature |
| `verifySignature(data, signature?)` | `string \| object, string?` | `boolean` | Low-level RSA signature verification |
| `rechargePhone(data)` | `{encrypted_sk, phone, operator, amount, offer}` | `ServiceResult` | Phone recharge |
| `rechargeInternet(data)` | `{encrypted_sk, phone, amount, offer}` | `ServiceResult` | Internet recharge |
| `rechargeGame(data)` | `{encrypted_sk, operator, playerId, amount, offer}` | `ServiceResult` | Game top-up |
| `payBill(data)` | `{encrypted_sk, operator, bill_id, amount}` | `ServiceResult` | Bill payment |
| `getProducts(encSk?)` | `string?` | `ServiceResult` | List available products |
| `getOperationHistory(encSk, limit, offset)` | `string, number, number` | `ServiceResult` | Mission history |
| `getOperationDetails(id, encSk)` | `string, string` | `ServiceResult` | Single operation details |

---

## 📱 Digital Services (Missions)

Mission APIs let your users spend DZT on real-world digital services. All Mission calls require the user's `encrypted_sk` (not the raw secret key).

### Phone Recharge

```javascript
const result = await sdk.rechargePhone({
  encrypted_sk: 'USER_ENCRYPTED_SECRET_KEY',
  phone:        '0661000000',
  operator:     'Mobilis',    // 'Mobilis' | 'Djezzy' | 'Ooredoo'
  amount:       '100',
  offer:        'Top'         // e.g., 'Top', 'Pix', etc.
});

if (result.success) {
  console.log('✅ Phone recharged!', result.data);
} else {
  console.error('❌ Recharge failed:', result.error);
}
```

### Internet Recharge (Idoom 4G)

```javascript
const result = await sdk.rechargeInternet({
  encrypted_sk: 'USER_ENCRYPTED_SECRET_KEY',
  phone:        '0661000000',
  operator:     'idoom',     // e.g., 'idoom'
  amount:       '2000',
  offer:        'adsl'       // e.g., 'adsl', '4g', etc.
});
```

### Game Top-up (FreeFire, PUBG)

```javascript
const result = await sdk.rechargeGame({
  encrypted_sk: 'USER_ENCRYPTED_SECRET_KEY',
  operator:     'freefire',   // e.g., 'freefire', 'pubg'
  playerId:     '123456789',
  amount:       '500',        // 'amount' from getProducts()
  offer:        'diamonds'    // 'name' from getProducts()
});
```

### Bill Payment

```javascript
const result = await sdk.payBill({
  encrypted_sk: 'USER_ENCRYPTED_SECRET_KEY',
  operator:     'sonelgaz', // e.g., 'sonelgaz', 'ade'
  bill_id:      'BILL_999',
  amount:       '1500'
});
```

### Get Available Products

Fetches the list of available services, operators, and their associated offers (products).

```javascript
const products = await sdk.getProducts();
if (products.success) {
  // Use products.data to populate Missions 'offer' and 'amount'
  console.log('Available services:', products.data);
}
```

> [!TIP]
> Each product in the `data` array usually contains `name` and `amount`. When calling recharge methods, use the product's `name` for the `offer` field and the product's `amount` for the `amount` field.

### Operation History & Details

```javascript
// Recent operations (paginated)
const history = await sdk.getOperationHistory('USER_ENCRYPTED_SK', 10, 0);
if (history.success) {
  console.log('Last 10 operations:', history.data);
}

// Details of a specific operation
const details = await sdk.getOperationDetails('OPERATION_ID', 'USER_ENCRYPTED_SK');
```

---

## 🏦 Bank Integration (CIB & EDAHABIA)

Generate a secure Dahabia/CIB bank payment link with optional real-time webhook callbacks and 3D Secure checkout. The customer is redirected to the hosted SATIM / SofizPay checkout gateway.

### Parameters Reference (`makeCIBTransaction` & `makeSandboxCIBTransaction`)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account` | `string` | **Yes** | Destination SofizPay account / Stellar public key (starts with `G`) |
| `amount` | `number` | **Yes** | Payment amount in Algerian Dinars (DZD / DZT) |
| `full_name` | `string` | **Yes** | Customer's full name as on the card |
| `phone` | `string` | **Yes** | Customer's phone number |
| `email` | `string` | **Yes** | Customer's email address |
| `webhook_url` | `string` | No | Asynchronous server-to-server HTTP POST notification URL |
| `return_url` | `string` | No | Client redirect URL after payment completion |
| `invoice_id` | `string` | No | Optional merchant invoice or order ID |
| `language` | `string` | No | Payment interface language (`'ar'`, `'fr'`, or `'en'`) |
| `memo` | `string` | No | Payment description or note (up to 28 bytes UTF-8) |
| `redirect` | `string \| boolean` | No | Set to `'yes'` / `true` to auto-redirect to gateway (default: `'no'`) |
| `keep_return_url` | `string \| boolean` | No | Append transaction query parameters to return URL (default: `'False'`) |
| `is_sandbox` | `boolean` | No | Route to Sandbox test gateway if `true` |

### Response Object

```typescript
{
  success: boolean;
  payment_url: string;        // Hosted checkout link to redirect the customer to
  cib_transaction_id: string; // Gateway order number
  transaction_id: string;     // SofizPay transaction UUID
  webhook_url: string;        // Registered webhook URL
  account: string;
  amount: number;
  is_sandbox: boolean;
  timestamp: string;
}
```

### Production Example

```javascript
import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK(); // Production instance

const result = await sdk.makeCIBTransaction({
  account:     'YOUR_PUBLIC_KEY',
  amount:      2500,
  full_name:   'Ahmed Benali',
  phone:       '0661234567',
  email:       'ahmed@example.com',
  memo:        'Order #1042',
  return_url:  'https://yourstore.com/checkout/success',
  webhook_url: 'https://yourstore.com/api/cib-webhook',
  language:    'ar'
});

if (result.success) {
  // 1. Save cib_transaction_id in your database linked to the order
  await db.orders.update({ id: 1042 }, { cib_order_id: result.cib_transaction_id });

  // 2. Redirect the user to SATIM gateway
  window.location.href = result.payment_url;
}
```

---

## 🧪 Sandbox Environment & Mock Cards

The SofizPay Sandbox simulates the SATIM CIB/EDAHABIA payment system without connecting to real bank accounts. It provides a full mock flow: card input form → OTP verification → status updates → return URL redirect.

### `makeSandboxCIBTransaction(transactionData)`

Automatically points to `https://sofizpay.com/sandbox/make-cib-transaction/`:

```javascript
const sdk = new SofizPaySDK(true); // Sandbox mode

const result = await sdk.makeSandboxCIBTransaction({
  account:     'YOUR_PUBLIC_KEY',
  amount:      150.0,
  full_name:   'Sandbox Tester',
  phone:       '0661000000',
  email:       'sandbox@sofizpay.com',
  webhook_url: 'https://yourstore.com/api/cib-webhook',
  return_url:  'https://yourstore.com/checkout/success'
});

console.log('Sandbox Payment URL:', result.payment_url);
```

### Sandbox Test Cards

Use the following test credentials on the sandbox payment page:

| Card Number | Expiry | CVV | Cardholder Name | Result | Note |
|-------------|--------|-----|-----------------|--------|------|
| `6280581001234567` | `12/28` | `123` | `TEST SUCCESS` | ✅ Approved | Use OTP `123456` |
| `6280581009876543` | `12/29` | `456` | `TEST SUCCESS TWO` | ✅ Approved | Use OTP `123456` |
| `6280581005555555` | `06/28` | `999` | `TEST DECLINED` | ❌ Declined by issuer | Tests card refusal |
| `6280581004444444` | `09/28` | `444` | `TEST INSUFFICIENT` | ❌ Insufficient funds | Tests insufficient balance |
| `6280581003333333` | `03/21` | `333` | `TEST EXPIRED` | ❌ Expired card | Tests expired card |
| `6280581002222222` | `11/28` | `222` | `TEST TIMEOUT` | ❌ Timeout | Tests transaction timeout |

> [!TIP]
> - **OTP Code:** Always enter `123456` on the OTP page for approved tests. Entering any other OTP triggers an `Invalid OTP` error.

### Check Status (`checkSandboxCIBStatus` & `checkCIBStatus`)

```javascript
// Check sandbox transaction status
const status = await sdk.checkSandboxCIBStatus(result.cib_transaction_id);
console.log('Order Status:', status.data.orderStatus); // 2 = Approved, 6 = Declined
```

---

## 🔔 Webhooks & Signature Verification

When a payment succeeds or fails, SofizPay delivers a server-to-server asynchronous HTTP `POST` event notification to your registered `webhook_url`.

### Webhook Event Payload (`cib.payment.updated`)

```json
{
  "event": "cib.payment.updated",
  "payment_status": "success",
  "transaction_id": "bb979126-4e55-49dd-8ecc-a1d59867d2b0",
  "cib_transaction_id": "5965287001",
  "order_id": "satim_order_a1b2c3d4",
  "order_number": 5965287001,
  "order_status": 2,
  "amount": 150000,
  "currency": "012",
  "error_code": null,
  "error_message": null,
  "action_code": null,
  "action_code_description": null,
  "resp_code": "00",
  "resp_code_desc": "Approved",
  "message": "https://yourstore.com/api/cib-webhook/success1500005965287001",
  "signature": "MEQCIFz8v982hfkjdsf983274hfkjsdf...=="
}
```

### Payload Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `event` | `string` | Always `"cib.payment.updated"` |
| `payment_status` | `string` | `"success"` or `"failed"` |
| `transaction_id` | `string` | SofizPay internal UUID |
| `cib_transaction_id` | `string` | SATIM / CIB Order Number |
| `order_number` | `number` | Numerical order identifier |
| `order_status` | `number` | `2`: Approved, `6`: Declined, `3`: Cancelled/Timeout |
| `amount` | `number` | Amount in cents (`150000` = `1500.00 DZD`) |
| `currency` | `string` | Currency ISO code (`"012"` = DZD) |
| `resp_code` | `string` | SATIM Response code (`"00"` = Approved) |
| `resp_code_desc` | `string` | SATIM status description |
| `message` | `string` | Signed string representation of transaction data |
| `signature` | `string` | RSA SHA-256 digital signature from SofizPay |

### Verifying Signatures (`verifyWebhookSignature`)

Always verify the RSA signature before updating databases to ensure authenticity:

#### Express.js Implementation:

```javascript
import express from 'express';
import SofizPaySDK from 'sofizpay-sdk-js';

const app = express();
app.use(express.json());

const sdk = new SofizPaySDK();

app.post('/api/cib-webhook', (req, res) => {
  const payload = req.body;

  // 1. Verify the digital signature
  const isValid = sdk.verifyWebhookSignature(payload);
  if (!isValid) {
    return res.status(400).send('Invalid signature');
  }

  // 2. Process order based on status
  if (payload.payment_status === 'success') {
    console.log(`Payment confirmed for Order: ${payload.order_number}`);
    // Update order status in your database and fulfill delivery
  } else {
    console.log(`Payment declined: ${payload.resp_code_desc}`);
  }

  res.status(200).send('OK');
});
```

#### Next.js Route Handler Implementation (`app/api/cib-webhook/route.js`):

```javascript
import { NextResponse } from 'next/server';
import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK();

export async function POST(request) {
  const payload = await request.json();

  // Validate official signature
  if (!sdk.verifyWebhookSignature(payload)) {
    return NextResponse.json({ error: 'Unauthorized signature' }, { status: 400 });
  }

  if (payload.payment_status === 'success') {
    // Fulfill customer purchase
    console.log(`Order ${payload.order_number} marked as PAID`);
  }

  return NextResponse.json({ received: true });
}
```

---

## 🔄 Return URL vs. Webhook Notifications

Understanding the difference between the customer redirect and the server webhook:

| Feature | Return URL (`return_url`) | Webhook (`webhook_url`) |
| :--- | :--- | :--- |
| **Protocol** | **`GET`** via customer browser redirect | **`POST`** direct server-to-server HTTP request |
| **Purpose** | Displaying "Thank you" page to the customer | Updating order status & fulfilling goods in DB |
| **Reliability** | Vulnerable if customer closes browser or network drops | **100% Reliable** (independent of customer connection) |
| **Security** | Carries plain URL query parameters | Secured with **RSA SHA-256 Digital Signature** |
| **Query Params** | `?sofizpay_return=cib&payment_status=...` | Formatted JSON body with full transaction payload |

> [!IMPORTANT]
> **Never fulfill orders based on `return_url` alone.** Always rely on the verified server webhook or the `checkCIBStatus()` endpoint for order confirmation.

---

## 🧪 Testing & Sandbox Validation

### 1. Safe Sandbox Testing (No Secret Key Required)

You do **not** need a private/secret key to test bank checkout links, mock cards, or webhook signature verification. You only need a public Stellar account (`G...`):

```javascript
// test_sandbox.js
import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK(true); // Sandbox mode

async function testSandboxPayment() {
  const result = await sdk.makeSandboxCIBTransaction({
    account:     'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Public key only
    amount:      150.0,
    full_name:   'Sandbox Tester',
    phone:       '0661000000',
    email:       'sandbox@sofizpay.com',
    memo:        'Safe Sandbox Test',
    webhook_url: 'https://your-domain.com/api/webhook',
    return_url:  'https://yourstore.com/checkout/success'
  });

  console.log('Payment URL:', result.payment_url);
  console.log('Order ID:', result.cib_transaction_id);
}

testSandboxPayment();
```

### 2. Testing On-Chain Payments (Using Environment Variables)

> [!CAUTION]
> **Never commit or hardcode private/secret keys (`S...`) into test files or version control.** Always load keys through environment variables or a secure `.env` file that is listed in `.gitignore`.

```javascript
// test_payment.js
import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK();

// Load secret key safely from environment
const secretKey = process.env.SOFIZPAY_SECRET_KEY;
if (!secretKey) {
  console.error('❌ Please set SOFIZPAY_SECRET_KEY in your environment');
  process.exit(1);
}

const payment = await sdk.submit({
  secretkey:            secretKey,
  destinationPublicKey: 'GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  amount:               1.0,
  memo:                 'Test Safe Payment'
});

console.log('Payment result:', payment);
```

Run securely in terminal:
```bash
# Windows PowerShell
$env:SOFIZPAY_SECRET_KEY="S..."; node test_payment.js

# Linux / macOS
SOFIZPAY_SECRET_KEY="S..." node test_payment.js
```

---

## 🔴 Real-time Transaction Streaming

Monitor an account for new incoming/outgoing transactions in real-time using polling.

### `startTransactionStream(publicKey, callback, fromNow?, checkInterval?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `publicKey` | `string` | required | Stellar account to monitor |
| `callback` | `function` | required | Called on each new transaction |
| `fromNow` | `boolean` | `true` | `true`: only future txs; `false`: load history first, then monitor |
| `checkInterval` | `number` | `30` | Polling interval in seconds (5–300) |

```javascript
// Monitor only new transactions (live feed)
await sdk.startTransactionStream(
  'YOUR_PUBLIC_KEY',
  (tx) => {
    console.log(`New ${tx.type}: ${tx.amount} DZT — memo: ${tx.memo}`);
  },
  true,   // fromNow
  15      // check every 15 seconds
);

// Load full history first, then monitor new transactions
await sdk.startTransactionStream(
  'YOUR_PUBLIC_KEY',
  (tx) => {
    if (tx.isHistorical) {
      console.log('Historical:', tx);
    } else {
      console.log('Live:', tx);
    }
  },
  false,  // fromNow = false → load history first
  30
);

// Check stream is active
const status = await sdk.getStreamStatus('YOUR_PUBLIC_KEY');
console.log('Active:', status.isActive);

// Stop monitoring
await sdk.stopTransactionStream('YOUR_PUBLIC_KEY');
```


---

## 📤 Response Format

All methods return a uniform object with a `success` flag:

```javascript
// ✅ Success
{
  success:   true,
  // ... method-specific fields
  timestamp: '2025-07-28T10:30:00.000Z'
}

// ❌ Failure
{
  success:   false,
  error:     'Human-readable error description',
  timestamp: '2025-07-28T10:30:00.000Z'
}
```

Always guard with `if (result.success)` before accessing data fields.

---

## 🛡️ Security Best Practices

| Rule | Why |
|------|-----|
| ❌ Never expose secret keys client-side | Frontend code is visible to all users |
| ✅ Use environment variables | `process.env.SECRET_KEY` — never hardcode |
| ✅ Keep `encrypted_sk` server-side | Protects Mission API access |
| ✅ Use HTTPS only | Ensure all network calls are encrypted |

```javascript
// ✅ Correct — environment variable
const result = await sdk.submit({
  secretkey: process.env.SOFIZPAY_SECRET_KEY,
  ...
});

// ❌ Never do this
const result = await sdk.submit({
  secretkey: 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ...
});
```

---

## 💡 Use Cases

### E-commerce / Online Store

```javascript
// Process a customer's order payment
async function chargeOrder(orderId, customerKey, amount) {
  const result = await sdk.submit({
    secretkey:            process.env.STORE_SECRET_KEY,
    destinationPublicKey: customerKey,
    amount:               amount,
    memo:                 `Order #${orderId}`
  });

  if (result.success) {
    await db.updateOrderStatus(orderId, 'paid', result.transactionHash);
  }

  return result;
}
```

### React Wallet Component

```jsx
import { useState, useEffect } from 'react';
import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK();

export function Wallet({ publicKey }) {
  const [balance, setBalance] = useState('--');

  useEffect(() => {
    sdk.getBalance(publicKey).then(r => {
      if (r.success) setBalance(r.balance);
    });
  }, [publicKey]);

  return (
    <div className="wallet-card">
      <h3>💰 {balance} DZT</h3>
    </div>
  );
}
```

### Real-time Notification System

```javascript
// Alert users when they receive a payment
await sdk.startTransactionStream(userPublicKey, (tx) => {
  if (tx.type === 'received') {
    sendPushNotification(userId, `You received ${tx.amount} DZT!`);
  }
}, true, 10);
```

---

## 📞 Support

- 🌐 **Website**: [SofizPay.com](https://sofizpay.com)
- 📚 **Full Docs**: [GitHub Repository](https://github.com/kenandarabeh/sofizpay-sdk#readme)
- 🐛 **Bug Reports**: [Open an Issue](https://github.com/kenandarabeh/sofizpay-sdk/issues)
- 💬 **Discussions**: [Community Forum](https://github.com/kenandarabeh/sofizpay-sdk/discussions)

---

## License

MIT © [SofizPay Team](https://github.com/kenandarabeh)

---

**Built with ❤️ for JavaScript developers | Version `1.1.11`**
