import { sendPayment, getTransactions, getPublicKeyFromSecret, getBalance, setupTransactionStream, getTransactionByHash } from './stellarUtils.js';
import axios from 'axios';
import forge from 'node-forge';

class SofizPaySDK {
  constructor(isSandbox = false) {
    this.version = '1.3.0';
    this.isSandbox = isSandbox;
    this.activeStreams = new Map();
    this.transactionCallbacks = new Map();
    this.streamCloseFunctions = new Map(); 
  }
  
  async submit(data) {
    if (!data.secretkey) {
      throw new Error('Secret key is required.');
    }
    if (!data.destinationPublicKey) {
      throw new Error('Destination public key is required.');
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error('Valid amount is required.');
    }
    if (!data.memo) {
      throw new Error('Memo is required.');
    }
    
    try {
      const result = await sendPayment(
        data.secretkey,
        data.destinationPublicKey,
        data.amount,
        data.memo
      );

      if (result.success) {
        return {
          success: true,
          transactionId: result.hash,
          transactionHash: result.hash,
          amount: data.amount,
          memo: data.memo,
          destinationPublicKey: data.destinationPublicKey,
          duration: result.duration,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Alias for submit() supporting both object and direct argument forms
   */
  async sendPayment(secretOrData, destinationPublicKey, amount, memo) {
    if (typeof secretOrData === 'object' && secretOrData !== null) {
      return this.submit(secretOrData);
    }
    return this.submit({
      secretkey: secretOrData,
      destinationPublicKey,
      amount,
      memo
    });
  }

  async getTransactions(publicKey, limit = null, cursor = null) {

    if (!publicKey) {
      throw new Error('public Key is required.');
    }

    try {
      const transactions = await getTransactions(publicKey, limit, cursor);
      const formattedTransactions = transactions.map(tx => ({
        id: tx.hash,
        transactionId: tx.hash,
        hash: tx.hash,
        amount: parseFloat(tx.amount),
        memo: tx.memo,
        type: tx.type,
        from: tx.from,
        paging_token: tx.paging_token,
        to: tx.to,
        asset_code: tx.asset_code,
        asset_issuer: tx.asset_issuer,
        status: 'completed',
        timestamp: tx.created_at,
        created_at: tx.created_at
      }));

      return {
        success: true,
        transactions: formattedTransactions,
        total: formattedTransactions.length,
        publicKey: publicKey,
        message: `Fetched all transactions (${formattedTransactions.length} transactions)`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        error: error.message,
        transactions: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  async getBalance(publicKey) {
    if (!publicKey) {
      throw new Error('Public key is required.');
    }

    try {
      console.log('SDK: Fetching balance for:', publicKey);
      
      const balance = await getBalance(publicKey);
      
      console.log('SDK: Balance result:', balance);
      
      return {
        success: true,
        balance: balance,
        publicKey: publicKey,
        asset_code: 'DZT',
        asset_issuer: 'GCAZI7YBLIDJWIVEL7ETNAZGPP3LC24NO6KAOBWZHUERXQ7M5BC52DLV',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('SDK: Error fetching balance:', error);
      
      // إعادة رسالة خطأ مفصلة أكثر
      let errorMessage = error.message;
      
      if (error.message.includes('Account not found')) {
        errorMessage = 'Account not found or not activated on Stellar network. Make sure the account has been funded with at least 1 XLM.';
      } else if (error.message.includes('Bad request')) {
        errorMessage = 'Invalid public key format. Please check that you are using a valid Stellar public key.';
      } else if (error.message.includes('Invalid public key')) {
        errorMessage = 'Invalid public key format. Public keys should start with G and be 56 characters long.';
      }
      
      return {
        success: false,
        error: errorMessage,
        balance: 0,
        publicKey: publicKey,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getPublicKey(secretkey) {
    if (!secretkey) {
      throw new Error('Secret key is required.');
    }

    try {
      const publicKey = getPublicKeyFromSecret(secretkey);
      return {
        success: true,
        publicKey: publicKey,
        secretKey: secretkey,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting public key:', error);
      return {
        success: false,
        error: error.message,
        publicKey: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  async startTransactionStream(publicKey, onNewTransaction, fromNow = true, cursor = 'now', checkInterval = 30) {
    if (!publicKey) {
      throw new Error('public Key is required.');
    }
    if (!onNewTransaction || typeof onNewTransaction !== 'function') {
      throw new Error('Callback function is required.');
    }
    if (checkInterval < 5 || checkInterval > 300) {
      throw new Error('Check interval must be between 5 and 300 seconds.');
    }

    try {
      if (this.activeStreams.has(publicKey)) {
        return {
          success: false,
          error: 'Transaction stream already active for this account',
          publicKey: publicKey
        };
      }


      const transactionHandler = (newTransaction) => {
        const formattedTransaction = {
          id: newTransaction.id,
          transactionId: newTransaction.id,
          hash: newTransaction.id,
          amount: parseFloat(newTransaction.amount),
          memo: newTransaction.memo,
          type: newTransaction.destination === publicKey ? 'received' : 'sent',
          from: newTransaction.source_account,
          to: newTransaction.destination,
          paging_token: newTransaction.paging_token, 
          asset_code: newTransaction.asset_code,
          asset_issuer: newTransaction.asset_issuer,
          status: newTransaction.status,
          timestamp: newTransaction.created_at,
          created_at: newTransaction.created_at,
          processed_at: newTransaction.processed_at,
          isHistorical: false 
        };

        onNewTransaction(formattedTransaction);
      };

      const closeFunction = setupTransactionStream(publicKey, transactionHandler, cursor, checkInterval);      
      if (closeFunction && typeof closeFunction === 'function') {
        this.streamCloseFunctions.set(publicKey, closeFunction);
      }
      
      this.activeStreams.set(publicKey, {
        publicKey: publicKey,
        startTime: new Date().toISOString(),
        isActive: true,
        fromNow: fromNow,
        checkInterval: checkInterval
      });
      
      this.transactionCallbacks.set(publicKey, onNewTransaction);

      return {
        success: true,
        message: `Transaction stream started successfully (${fromNow ? 'from now' : 'with history'}, checking every ${checkInterval}s)`,
        publicKey: publicKey,
        fromNow: fromNow,
        checkInterval: checkInterval,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error starting transaction stream:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async stopTransactionStream(publicKey) {
    if (!publicKey) {
      throw new Error('public Key is required.');
    }

    try {
      if (!this.activeStreams.has(publicKey)) {
        return {
          success: false,
          error: 'No active transaction stream found for this account',
          publicKey: publicKey
        };
      }

      const streamInfo = this.activeStreams.get(publicKey);

      if (this.streamCloseFunctions && this.streamCloseFunctions.has(publicKey)) {
        const closeFunction = this.streamCloseFunctions.get(publicKey);
        if (typeof closeFunction === 'function') {
          closeFunction();
        }
        this.streamCloseFunctions.delete(publicKey);
      }

      this.activeStreams.delete(publicKey);
      this.transactionCallbacks.delete(publicKey);

      return {
        success: true,
        message: 'Transaction stream stopped successfully',
        publicKey: publicKey,
        streamInfo: streamInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error stopping transaction stream:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStreamStatus(publicKey) {
    if (!publicKey) {
      throw new Error('public Key is required.');
    }

    try {
      const streamInfo = this.activeStreams.get(publicKey);
      
      return {
        success: true,
        isActive: !!streamInfo,
        publicKey: publicKey,
        streamInfo: streamInfo || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isActive: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  getVersion() {
    return this.version;
  }

  async searchTransactionsByMemo(publicKey, memo, limit = 50) {
    if (!publicKey) {
      throw new Error('public Key is required.');
    }
    if (!memo) {
      throw new Error('Memo is required for search.');
    }

    try {
      const transactions = await getTransactions(publicKey, 200);
      
      if (!transactions || !Array.isArray(transactions)) {
        return {
          success: true,
          transactions: [],
          total: 0,
          totalFound: 0,
          searchMemo: memo,
          publicKey: publicKey,
          message: `There are no transactions in this account`,
          timestamp: new Date().toISOString()
        };
      }
      
      const filteredTransactions = transactions.filter(tx => {
        if (!tx || !tx.memo) return false;
        
        try {
          return tx.memo.toLowerCase().includes(memo.toLowerCase());
        } catch (error) {
          console.warn('Error filtering transaction:', tx, error);
          return false;
        }
      });
      
      const limitedTransactions = filteredTransactions.slice(0, limit);
      
      const formattedTransactions = limitedTransactions.map(tx => {
        try {
          return {
            id: tx.hash || tx.id || 'unknown',
            transactionId: tx.hash || tx.id || 'unknown',
            hash: tx.hash || tx.id || 'unknown',
            amount: parseFloat(tx.amount) || 0,
            memo: tx.memo || '',
            type: tx.type || 'unknown', 
            from: tx.from || 'unknown',
            to: tx.to || 'unknown',
            asset_code: tx.asset_code || '',
            asset_issuer: tx.asset_issuer || '',
            status: 'completed',
            timestamp: tx.created_at || new Date().toISOString(),
            created_at: tx.created_at || new Date().toISOString()
          };
        } catch (error) {
          console.warn('Error formatting transaction:', tx, error);
          return null;
        }
      }).filter(tx => tx !== null);

      return {
        success: true,
        transactions: formattedTransactions,
        total: formattedTransactions.length,
        totalFound: filteredTransactions.length,
        searchMemo: memo,
        publicKey: publicKey,
        message: `Found ${filteredTransactions.length} transactions containing "${memo}"`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error searching transactions by memo:', error);
      return {
        success: false,
        error: error.message,
        transactions: [],
        searchMemo: memo,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getTransactionByHash(transactionHash) {
    if (!transactionHash) {
      throw new Error('Transaction hash is required.');
    }

    try {
      const result = await getTransactionByHash(transactionHash);
      
      if (result.success && result.found) {
        return {
          success: true,
          found: true,
          transaction: result.transaction,
          has_operations: result.has_dzt_operations,
          operations_count: result.dzt_operations_count,
          operations: result.dzt_operations,
          hash: transactionHash,
          message: result.message,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: true,
          found: false,
          transaction: null,
          hash: transactionHash,
          message: result.message || 'Transaction not found',
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error searching for transaction by hash:', error);
      return {
        success: false,
        found: false,
        transaction: null,
        hash: transactionHash,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Initiate a CIB / EDAHABIA payment gateway transaction
   * @param {Object} transactionData - Transaction details
   * @param {string} transactionData.account - SofizPay account / public key
   * @param {number} transactionData.amount - Payment amount in DZD
   * @param {string} transactionData.full_name - Customer's full name
   * @param {string} transactionData.phone - Customer's phone number
   * @param {string} transactionData.email - Customer's email address
   * @param {string} [transactionData.return_url] - Redirect URL after payment
   * @param {string} [transactionData.webhook_url] - Async webhook notification URL (HTTP/HTTPS)
   * @param {string} [transactionData.invoice_id] - Optional merchant invoice identifier
   * @param {string} [transactionData.language] - Gateway language ('ar' | 'en' | 'fr')
   * @param {string} [transactionData.memo] - Payment description / note
   * @param {string|boolean} [transactionData.redirect] - 'yes' | 'no'
   * @param {string|boolean} [transactionData.keep_return_url] - 'True' | 'False'
   * @param {boolean} [transactionData.is_sandbox] - Use sandbox environment
   * @param {boolean} [transactionData.isSandbox] - Alias for is_sandbox
   * @returns {Promise<Object>}
   */
  async makeCIBTransaction(transactionData) {
    const isSandbox = Boolean(
      transactionData?.is_sandbox !== undefined ? transactionData.is_sandbox :
      transactionData?.isSandbox !== undefined ? transactionData.isSandbox :
      this.isSandbox
    );
    return this._makeCIBRequest(transactionData, isSandbox);
  }

  /**
   * Initiate a CIB transaction specifically in Sandbox mode.
   * @param {Object} transactionData 
   * @returns {Promise<Object>}
   */
  async makeSandboxCIBTransaction(transactionData) {
    return this._makeCIBRequest(transactionData, true);
  }

  async _makeCIBRequest(transactionData, useSandbox) {
    if (!transactionData) {
      throw new Error('Transaction data is required.');
    }
    if (!transactionData.account) {
      throw new Error('Account is required.');
    }
    if (!transactionData.amount || transactionData.amount <= 0) {
      throw new Error('Valid amount is required.');
    }
    if (!transactionData.full_name) {
      throw new Error('Full name is required.');
    }
    if (!transactionData.phone) {
      throw new Error('Phone number is required.');
    }
    if (!transactionData.email) {
      throw new Error('Email is required.');
    }

    try {
      const isSandbox = Boolean(useSandbox !== undefined ? useSandbox : this.isSandbox);
      const baseUrl = isSandbox 
        ? 'https://sofizpay.com/sandbox/make-cib-transaction/'
        : 'https://www.sofizpay.com/make-cib-transaction/';
      const params = new URLSearchParams();
      
      params.append('account', transactionData.account);
      params.append('amount', transactionData.amount.toString());
      params.append('full_name', transactionData.full_name);
      params.append('phone', transactionData.phone);
      params.append('email', transactionData.email);
      
      if (transactionData.return_url) {
        params.append('return_url', transactionData.return_url);
      }
      if (transactionData.webhook_url) {
        params.append('webhook_url', transactionData.webhook_url);
      }
      if (transactionData.invoice_id) {
        params.append('invoice_id', transactionData.invoice_id);
      }
      if (transactionData.language) {
        params.append('language', transactionData.language);
      }
      if (transactionData.memo) {
        params.append('memo', transactionData.memo);
      }
      if (transactionData.redirect !== undefined) {
        params.append('redirect', typeof transactionData.redirect === 'boolean'
          ? (transactionData.redirect ? 'yes' : 'no')
          : transactionData.redirect);
      }
      if (transactionData.keep_return_url !== undefined) {
        params.append('keep_return_url', typeof transactionData.keep_return_url === 'boolean'
          ? (transactionData.keep_return_url ? 'True' : 'False')
          : transactionData.keep_return_url);
      }

      const fullUrl = `${baseUrl}?${params.toString()}`;
      
      const response = await axios.get(fullUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseData = response.data;
      const paymentUrl = responseData?.payment_url || responseData?.cib_response?.formUrl || null;

      return {
        success: responseData?.status !== 'error' && responseData?.success !== false,
        data: responseData,
        payment_url: paymentUrl,
        transaction_id: responseData?.transaction_id || null,
        cib_transaction_id: responseData?.cib_transaction_id || null,
        order_id: responseData?.order_id || null,
        webhook_url: responseData?.webhook_url || transactionData.webhook_url || null,
        account: transactionData.account,
        amount: transactionData.amount,
        full_name: transactionData.full_name,
        phone: transactionData.phone,
        email: transactionData.email,
        memo: transactionData.memo,
        is_sandbox: isSandbox,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error making CIB transaction:', error);
      
      let errorMessage = error.message;
      let errorData = null;
      
      if (error.response) {
        errorData = error.response.data;
        errorMessage = `HTTP Error: ${error.response.status} - ${error.response.statusText}`;
        if (error.response.data && (error.response.data.message || error.response.data.error)) {
          errorMessage += ` - ${error.response.data.message || error.response.data.error}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error: No response received from server';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout: Server took too long to respond';
      }
      
      return {
        success: false,
        error: errorMessage,
        errorData: errorData,
        account: transactionData.account,
        amount: transactionData.amount,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Phone recharge service
   * @param {Object} data - Recharge data (encrypted_sk, phone, operator, amount, offer)
   */
  async rechargePhone(data) {
    return this._performServiceOperation(data);
  }

  /**
   * Internet recharge service
   * @param {Object} data - Recharge data (encrypted_sk, phone, operator, amount, offer)
   */
  async rechargeInternet(data) {
    return this._performServiceOperation(data);
  }

  /**
   * Game recharge service
   * @param {Object} data - Recharge data (encrypted_sk, operator, playerId, amount, offer)
   */
  async rechargeGame(data) {
    return this._performServiceOperation(data);
  }

  /**
   * Bill payment service
   * @param {Object} data - Bill data (encrypted_sk, operator, and utility specific fields)
   */
  async payBill(data) {
    return this._performServiceOperation(data);
  }

  /**
   * Internal helper for service operations
   * @private
   */
  async _performServiceOperation(data) {
    try {
      const response = await axios.post('https://www.sofizpay.com/services/operation_post', data, {
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this._handleAxiosError(error);
    }
  }

  /**
   * Get details of a specific operation
   * @param {string} operationId 
   * @param {string} encryptedSecretKey 
   */
  async getOperationDetails(operationId, encryptedSecretKey) {
    try {
      const response = await axios.get(`https://sofizpay.com/services/operation-detail/${operationId}/`, {
        params: { encrypted_sk: encryptedSecretKey }
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this._handleAxiosError(error);
    }
  }

  /**
   * Get operation history
   * @param {string} encryptedSecretKey 
   * @param {number} limit 
   * @param {number} offset 
   */
  async getOperationHistory(encryptedSecretKey, limit = 10, offset = 0) {
    try {
      const response = await axios.get('https://sofizpay.com/services/operation-history/', {
        params: {
          encrypted_sk: encryptedSecretKey,
          limit,
          offset
        }
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this._handleAxiosError(error);
    }
  }

  /**
   * Get available products/services
   * @param {string} encryptedSecretKey - Optional encrypted secret key
   */
  async getProducts(encryptedSecretKey) {
    try {
      const response = await axios.get('https://sofizpay.com/services/get_products/', {
        data: { encrypted_sk: encryptedSecretKey },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this._handleAxiosError(error);
    }
  }

  /**
   * Check status of a CIB transaction (Sandbox/Prod)
   * @param {string} cibTransactionId 
   * @param {boolean} [isSandbox] - Explicit sandbox override
   */
  async checkCIBStatus(cibTransactionId, isSandbox) {
    const useSandbox = Boolean(isSandbox !== undefined ? isSandbox : this.isSandbox);
    return this._checkCIBStatusRequest(cibTransactionId, useSandbox);
  }

  /**
   * Check status of a CIB transaction specifically in Sandbox mode.
   * @param {string} cibTransactionId 
   * @returns {Promise<Object>}
   */
  async checkSandboxCIBStatus(cibTransactionId) {
    return this.checkCIBStatus(cibTransactionId, true);
  }

  async _checkCIBStatusRequest(cibTransactionId, useSandbox) {
    try {
      const baseUrl = useSandbox
        ? 'https://sofizpay.com/sandbox/cib-transaction-check/'
        : 'https://www.sofizpay.com/cib-transaction-check/';
        
      const response = await axios.get(baseUrl, {
        params: { order_number: cibTransactionId }
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this._handleAxiosError(error);
    }
  }

  /**
   * Internal helper for handling axios errors
   * @private
   */
  _handleAxiosError(error) {
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `HTTP Error: ${error.response.status} - ${error.response.statusText}`;
      if (error.response.data && error.response.data.error) {
        errorMessage += ` - ${error.response.data.error}`;
      }
    }
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify digital RSA signature of a callback / webhook notification
   * @param {Object|string} verificationData - Payload object or message string
   * @param {string} [signature] - Signature string if verificationData is message
   * @returns {boolean} - True if signature is valid
   */
  verifySignature(verificationData, signature) {
    let message = '';
    let sig = '';

    if (typeof verificationData === 'string') {
      message = verificationData;
      sig = signature || '';
    } else if (verificationData && typeof verificationData === 'object') {
      message = verificationData.message || '';
      sig = verificationData.signature_url_safe || verificationData.signature || '';
    }

    if (!message || !sig) {
      return false;
    }

    const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1N+bDPxpqeB9QB0affr/
02aeRXAAnqHuLrgiUlVNdXtF7t+2w8pnEg+m9RRlc+4YEY6UyKTUjVe6k7v2p8Jj
UItk/fMNOEg/zY222EbqsKZ2mF4hzqgyJ3QHPXjZEEqABkbcYVv4ZyV2Wq0x0ykI
+Hy/5YWKeah4RP2uEML1FlXGpuacnMXpW6n36dne3fUN+OzILGefeRpmpnSGO5+i
JmpF2mRdKL3hs9WgaLSg6uQyrQuJA9xqcCpUmpNbIGYXN9QZxjdyRGnxivTE8awx
THV3WRcKrP2krz3ruRGF6yP6PVHEuPc0YDLsYjV5uhfs7JtIksNKhRRAQ16bAsj/
9wIDAQAB
-----END PUBLIC KEY-----`;

    try {
      let base64 = sig
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const signatureBytes = forge.util.decode64(base64);
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const md = forge.md.sha256.create();
      md.update(message, 'utf8');
      
      return publicKey.verify(md.digest().bytes(), signatureBytes);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Helper method specifically to verify incoming webhook payloads
   * @param {Object} webhookPayload - Webhook payload object containing message and signature
   * @returns {boolean} - True if signature is valid
   */
  verifyWebhookSignature(webhookPayload) {
    return this.verifySignature(webhookPayload);
  }
}

export { SofizPaySDK };
export default SofizPaySDK;