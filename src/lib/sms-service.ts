// SMS service for delivery notifications
// This is a mock implementation for development
// In production, this would integrate with SMS providers like Twilio, Vonage, or local Mozambican SMS gateways

export type SMSMessage = {
  to: string;
  message: string;
  orderId?: number;
};

export async function sendSMS(smsData: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Mock SMS sending for development
    console.log(`📱 SMS Mock: Sending to ${smsData.to}: ${smsData.message}`);
    
    // In production, this would integrate with:
    // - Twilio: https://www.twilio.com/docs/sms
    // - Vonage (formerly Nexmo): https://developer.vonage.com/messaging/sms/overview
    // - African SMS providers like Bulk SMS, SMS Portal, etc.
    // - Local Mozambican SMS gateways
    
    // For Mozambique, common SMS providers include:
    // - Vodacom Mozambique SMS API
    // - Movitel SMS Gateway
    // - tmcel SMS services
    
    // Mock successful response
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    };
    
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error',
    };
  }
}

// Function to validate Mozambican phone numbers
export function validateMozambiquePhone(phone: string): { valid: boolean; formatted?: string; error?: string } {
  try {
    // Remove all non-numeric characters except +
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Mozambique country code is +258
    // Mobile numbers typically start with 8 after country code
    // Format: +258 8X XXX XXXX
    
    if (cleanPhone.startsWith('+258')) {
      cleanPhone = cleanPhone.substring(4); // Remove +258
    } else if (cleanPhone.startsWith('258')) {
      cleanPhone = cleanPhone.substring(3); // Remove 258
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1); // Remove leading 0
    }
    
    // Check if it's a valid mobile number (starts with 8 and has 8 more digits)
    if (cleanPhone.length === 9 && cleanPhone.startsWith('8')) {
      return {
        valid: true,
        formatted: `+258${cleanPhone}`,
      };
    }
    
    // Check if it's already a valid 9-digit number
    if (cleanPhone.length === 9 && /^[0-9]{9}$/.test(cleanPhone)) {
      return {
        valid: true,
        formatted: `+258${cleanPhone}`,
      };
    }
    
    return {
      valid: false,
      error: 'Invalid Mozambican phone number format. Expected format: +258 8X XXX XXXX',
    };
    
  } catch (error) {
    return {
      valid: false,
      error: 'Error validating phone number',
    };
  }
}

// Function to send bulk SMS messages
export async function sendBulkSMS(messages: SMSMessage[]): Promise<Array<{ success: boolean; messageId?: string; error?: string; to: string }>> {
  const results: Array<{ success: boolean; messageId?: string; error?: string; to: string }> = [];
  
  for (const message of messages) {
    const result = await sendSMS(message);
    results.push({
      ...result,
      to: message.to,
    });
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Function to get SMS delivery status (for production implementation)
export async function getSMSStatus(messageId: string): Promise<{ delivered: boolean; status: string; error?: string }> {
  // Mock implementation
  console.log(`📱 SMS Status Check: ${messageId}`);
  
  return {
    delivered: true,
    status: 'delivered',
  };
}

// Configuration for different SMS providers
export const smsProviderConfig = {
  // Twilio configuration (international)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    apiUrl: 'https://api.twilio.com/2010-04-01',
  },
  
  // Vonage configuration (international) 
  vonage: {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    fromNumber: process.env.VONAGE_FROM_NUMBER,
    apiUrl: 'https://rest.nexmo.com/sms/json',
  },
  
  // Local Mozambican providers would go here
  vodacom_mz: {
    apiKey: process.env.VODACOM_MZ_API_KEY,
    apiUrl: process.env.VODACOM_MZ_API_URL,
  },
  
  movitel: {
    apiKey: process.env.MOVITEL_API_KEY,
    apiUrl: process.env.MOVITEL_API_URL,
  },
};

export default { sendSMS, sendBulkSMS, getSMSStatus, validateMozambiquePhone };