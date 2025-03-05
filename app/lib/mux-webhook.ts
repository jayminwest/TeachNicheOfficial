import crypto from 'crypto';

/**
 * Verify a Mux webhook signature
 * @param signature The mux-signature header value
 * @param rawBody The raw request body as a string
 * @param secret The webhook secret from Mux
 * @returns boolean indicating if the signature is valid
 */
export function verifyMuxWebhookSignature(
  signature: string | null, 
  rawBody: string, 
  secret: string
): boolean {
  if (!signature) {
    return false;
  }
  
  try {
    // Parse the signature header
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      console.error('Invalid Mux signature format');
      return false;
    }
    
    const timestamp = timestampPart.substring(2);
    const signatureValue = signaturePart.substring(3);
    
    // Create the expected signature
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Compare signatures
    return signatureValue === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
