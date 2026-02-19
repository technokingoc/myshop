import { getDb } from "@/lib/db";
import { payments, paymentStatusHistory, paymentInstructions } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface PaymentRequest {
  orderId: number;
  sellerId: number;
  customerId?: number;
  method: 'mpesa' | 'bank_transfer' | 'cash_on_delivery';
  amount: number;
  currency: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

export interface MpesaPaymentRequest extends PaymentRequest {
  method: 'mpesa';
  customerPhone: string;
  provider: 'vodacom' | 'movitel'; // Mozambique M-Pesa providers
}

export interface PaymentResponse {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  externalId?: string;
  confirmationCode?: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface MpesaConfig {
  vodacom: {
    apiKey: string;
    publicKey: string;
    serviceProviderCode: string;
    baseUrl: string;
    environment: 'sandbox' | 'production';
  };
  movitel: {
    apiKey: string;
    publicKey: string;
    serviceProviderCode: string;
    baseUrl: string;
    environment: 'sandbox' | 'production';
  };
}

class PaymentService {
  private db = getDb();
  
  private mpesaConfig: MpesaConfig = {
    vodacom: {
      apiKey: process.env.MPESA_VODACOM_API_KEY || '',
      publicKey: process.env.MPESA_VODACOM_PUBLIC_KEY || '',
      serviceProviderCode: process.env.MPESA_VODACOM_SERVICE_PROVIDER_CODE || '',
      baseUrl: process.env.MPESA_VODACOM_BASE_URL || 'https://api.vm.co.mz:18352/ipg/v1x',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    },
    movitel: {
      apiKey: process.env.MPESA_MOVITEL_API_KEY || '',
      publicKey: process.env.MPESA_MOVITEL_PUBLIC_KEY || '',
      serviceProviderCode: process.env.MPESA_MOVITEL_SERVICE_PROVIDER_CODE || '',
      baseUrl: process.env.MPESA_MOVITEL_BASE_URL || 'https://api.movitel.co.mz/mpesa/v1',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    }
  };

  /**
   * Create a new payment record
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const netAmount = request.amount; // For now, assuming no fees deducted upfront
    
    const [payment] = await this.db.insert(payments).values({
      orderId: request.orderId,
      sellerId: request.sellerId,
      customerId: request.customerId,
      method: request.method,
      status: 'pending',
      amount: request.amount.toString(),
      fees: '0',
      netAmount: netAmount.toString(),
      currency: request.currency,
      payerPhone: request.customerPhone || '',
      payerName: request.customerName || '',
      payerEmail: request.customerEmail || '',
      metadata: request.metadata || {}
    }).returning();

    // Record initial status
    await this.addStatusHistory(payment.id, 'pending', '', 'Payment created');

    // Process based on payment method
    switch (request.method) {
      case 'mpesa':
        return await this.processMpesaPayment(payment.id, request as MpesaPaymentRequest);
      case 'bank_transfer':
        return await this.processBankTransfer(payment.id, request);
      case 'cash_on_delivery':
        return await this.processCashOnDelivery(payment.id, request);
      default:
        throw new Error(`Unsupported payment method: ${request.method}`);
    }
  }

  /**
   * Process M-Pesa payment via Vodacom or Movitel
   */
  private async processMpesaPayment(paymentId: number, request: MpesaPaymentRequest): Promise<PaymentResponse> {
    try {
      await this.updatePaymentStatus(paymentId, 'processing', 'Initiating M-Pesa payment');
      
      const config = this.mpesaConfig[request.provider];
      
      if (!config.apiKey || !config.publicKey) {
        throw new Error(`M-Pesa configuration missing for ${request.provider}`);
      }

      // Generate unique transaction reference
      const transactionRef = `MYSHOP_${paymentId}_${Date.now()}`;
      
      // Prepare M-Pesa payment request
      const mpesaRequest = {
        input_ServiceProviderCode: config.serviceProviderCode,
        input_CustomerMSISDN: this.formatPhoneNumber(request.customerPhone),
        input_Amount: request.amount,
        input_TransactionReference: transactionRef,
        input_ThirdPartyConversationID: `TXN_${paymentId}_${Date.now()}`,
        input_PurchasedItemsDesc: `Order ${request.orderId} payment`
      };

      // Call M-Pesa API
      const response = await this.callMpesaAPI(config, mpesaRequest, 'c2b');
      
      if (response.success) {
        // Update payment with external ID
        await this.db.update(payments)
          .set({
            externalId: response.transactionId,
            externalReference: transactionRef,
            metadata: { 
              ...request.metadata, 
              webhookData: response 
            },
            updatedAt: new Date()
          })
          .where(eq(payments.id, paymentId));

        return {
          id: paymentId,
          status: 'processing',
          externalId: response.transactionId,
          instructions: `Please complete the payment by dialing *150*00# and following the prompts. Transaction ID: ${response.transactionId}`,
          metadata: { transactionRef, mpesaResponse: response }
        };
      } else {
        await this.updatePaymentStatus(paymentId, 'failed', `M-Pesa error: ${response.error}`);
        throw new Error(`M-Pesa payment failed: ${response.error}`);
      }
    } catch (error) {
      await this.updatePaymentStatus(paymentId, 'failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Process bank transfer - provides instructions to customer
   */
  private async processBankTransfer(paymentId: number, request: PaymentRequest): Promise<PaymentResponse> {
    // Get seller's bank transfer instructions
    const instructions = await this.db.select()
      .from(paymentInstructions)
      .where(
        and(
          eq(paymentInstructions.sellerId, request.sellerId),
          eq(paymentInstructions.method, 'bank_transfer'),
          eq(paymentInstructions.active, true)
        )
      )
      .orderBy(paymentInstructions.sortOrder)
      .limit(1);

    let instructionText = 'Please contact the seller for bank transfer details.';
    
    if (instructions.length > 0) {
      const inst = instructions[0];
      instructionText = `
        Bank Transfer Instructions:
        Bank: ${inst.bankName}
        Account Number: ${inst.accountNumber}
        Account Name: ${inst.accountName}
        ${inst.swiftCode ? `SWIFT Code: ${inst.swiftCode}` : ''}
        ${inst.iban ? `IBAN: ${inst.iban}` : ''}
        
        Reference: Order #${request.orderId}
        Amount: ${request.amount} ${request.currency}
        
        ${inst.instructionsEn || ''}
      `;
    }

    return {
      id: paymentId,
      status: 'pending',
      instructions: instructionText.trim(),
      metadata: { bankTransferInstructions: instructions[0] }
    };
  }

  /**
   * Process cash on delivery
   */
  private async processCashOnDelivery(paymentId: number, request: PaymentRequest): Promise<PaymentResponse> {
    return {
      id: paymentId,
      status: 'pending',
      instructions: `Payment will be collected on delivery. Amount: ${request.amount} ${request.currency}`,
      metadata: { deliveryRequired: true }
    };
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: number, 
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    reason?: string,
    metadata?: Record<string, any>
  ) {
    // Get current status for history
    const current = await this.db.select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    
    if (current.length === 0) {
      throw new Error('Payment not found');
    }

    const previousStatus = current[0].status;
    
    // Update payment
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Set timestamp based on status
    switch (status) {
      case 'processing':
        updateData.processedAt = new Date();
        break;
      case 'completed':
        updateData.completedAt = new Date();
        updateData.processedAt = updateData.processedAt || new Date();
        break;
      case 'failed':
        updateData.failedAt = new Date();
        break;
    }

    if (metadata) {
      updateData.metadata = { ...current[0].metadata, ...metadata };
    }

    await this.db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentId));

    // Add to status history
    await this.addStatusHistory(paymentId, status, previousStatus, reason);
  }

  /**
   * Add status history record
   */
  private async addStatusHistory(
    paymentId: number, 
    status: string, 
    previousStatus: string, 
    reason?: string,
    createdBy = 'system'
  ) {
    await this.db.insert(paymentStatusHistory).values({
      paymentId,
      status,
      previousStatus,
      reason: reason || '',
      createdBy
    });
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: number) {
    const [payment] = await this.db.select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    
    return payment || null;
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: number) {
    const [payment] = await this.db.select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.id))
      .limit(1);
    
    return payment || null;
  }

  /**
   * Process webhook from M-Pesa
   */
  async processWebhook(payload: any, provider: 'vodacom' | 'movitel') {
    try {
      // Find payment by external ID or reference
      let payment = null;
      
      if (payload.input_TransactionReference) {
        const [found] = await this.db.select()
          .from(payments)
          .where(eq(payments.externalReference, payload.input_TransactionReference))
          .limit(1);
        payment = found;
      }

      if (!payment && payload.input_ThirdPartyConversationID) {
        const [found] = await this.db.select()
          .from(payments)
          .where(eq(payments.externalId, payload.input_ThirdPartyConversationID))
          .limit(1);
        payment = found;
      }

      if (!payment) {
        console.error('Payment not found for webhook:', payload);
        return { success: false, error: 'Payment not found' };
      }

      // Update based on webhook result
      const webhookStatus = payload.output_ResponseCode === 'INS-0' ? 'completed' : 'failed';
      const confirmationCode = payload.output_TransactionID || '';
      
      await this.db.update(payments)
        .set({
          status: webhookStatus,
          confirmationCode,
          metadata: { ...payment.metadata, webhookData: payload },
          completedAt: webhookStatus === 'completed' ? new Date() : undefined,
          failedAt: webhookStatus === 'failed' ? new Date() : undefined,
          updatedAt: new Date()
        })
        .where(eq(payments.id, payment.id));

      await this.addStatusHistory(
        payment.id,
        webhookStatus,
        payment.status,
        `Webhook received: ${payload.output_ResponseDesc || 'Payment processed'}`,
        'webhook'
      );

      return { success: true, paymentId: payment.id, status: webhookStatus };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Format phone number for M-Pesa (Mozambique format)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Mozambique numbers: +258 XX XXX XXXX
    if (cleanPhone.startsWith('258')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('84') || cleanPhone.startsWith('85') || cleanPhone.startsWith('86') || cleanPhone.startsWith('87')) {
      return '258' + cleanPhone;
    } else if (cleanPhone.length === 9) {
      return '258' + cleanPhone;
    }
    
    return cleanPhone;
  }

  /**
   * Call M-Pesa API
   */
  private async callMpesaAPI(config: any, requestData: any, endpoint: 'c2b' | 'b2c'): Promise<any> {
    // This is a mock implementation for development
    // In production, this would make actual API calls to M-Pesa
    
    if (config.environment === 'sandbox' || !config.apiKey) {
      // Mock response for development
      return {
        success: true,
        transactionId: `MOCK_TXN_${Date.now()}`,
        conversationId: requestData.input_ThirdPartyConversationID,
        responseCode: 'INS-0',
        responseDescription: 'Payment processed successfully (SANDBOX)'
      };
    }

    // Production implementation would go here
    const url = `${config.baseUrl}/${endpoint === 'c2b' ? 'c2bpayment/singleStage' : 'b2cpayment'}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Origin': '*'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      return {
        success: response.ok,
        ...data,
        error: !response.ok ? data.output_ResponseDesc || 'API call failed' : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get revenue summary for a seller
   */
  async getRevenueSummary(sellerId: number, startDate?: Date, endDate?: Date) {
    try {
      const conditions = [eq(payments.sellerId, sellerId)];
      
      if (startDate) {
        conditions.push(sql`${payments.createdAt} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${payments.createdAt} <= ${endDate}`);
      }

      const allPayments = await this.db.select().from(payments).where(and(...conditions));
      const completedPayments = allPayments.filter(p => p.status === 'completed');
      
      return {
        totalRevenue: allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        confirmedRevenue: completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        totalFees: completedPayments.reduce((sum, p) => sum + parseFloat(p.fees || "0"), 0),
        netRevenue: completedPayments.reduce((sum, p) => sum + parseFloat(p.netAmount), 0),
        totalPayments: allPayments.length,
        completedPayments: completedPayments.length,
        pendingPayments: allPayments.filter(p => p.status === 'pending' || p.status === 'processing').length
      };
    } catch (error) {
      console.error('Error getting revenue summary:', error);
      throw error;
    }
  }

  /**
   * Get payments for a seller
   */
  async getSellerPayments(sellerId: number, limit = 50, offset = 0) {
    return await this.db.select()
      .from(payments)
      .where(eq(payments.sellerId, sellerId))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);
  }
}

// Export the service instance and helper functions
export const paymentService = new PaymentService();

export const getRevenueSummary = (sellerId: number, startDate?: Date, endDate?: Date) => 
  paymentService.getRevenueSummary(sellerId, startDate, endDate);

export const getSellerPayments = (sellerId: number, limit?: number, offset?: number) =>
  paymentService.getSellerPayments(sellerId, limit, offset);