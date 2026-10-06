/**
 * Generates polite payment reminder messages in different languages.
 */

export type ReminderLanguage = "en" | "ur" | "hi";

export interface ReminderData {
  customerName: string;
  balance: number; // positive means they owe money
  shopName?: string;
}

export function generateReminderMessage(data: ReminderData, lang: ReminderLanguage): string {
  const amount = data.balance.toFixed(2);
  const shop = data.shopName ? ` from ${data.shopName}` : "";
  const shopUr = data.shopName ? ` (${data.shopName})` : "";
  
  switch (lang) {
    case "ur":
      return `السلام علیکم ${data.customerName}،\nامید ہے آپ خیریت سے ہوں گے۔ آپ کے کھاتے میں ${amount} روپے بقایا ہیں۔ براہ کرم جلد از جلد ادائیگی کی کوشش کریں۔${shopUr}\nشکریہ!`;
    
    case "hi":
      return `नमस्ते ${data.customerName},\nआशा है आप ठीक होंगे। आपके खाते में ₹${amount} बकाया हैं। कृपया जल्द से जल्द भुगतान करने का प्रयास करें।${shopUr}\nधन्यवाद!`;
    
    case "en":
    default:
      return `Hello ${data.customerName},\nHope you're doing well. Just a polite reminder that your pending balance is Rs. ${amount}${shop}. Please try to settle it at your earliest convenience.\nThank you!`;
  }
}

/**
 * Generates a WhatsApp wa.me link with pre-filled text.
 * Note: phone number must include country code without '+' (e.g., "923001234567").
 */
export function generateWhatsAppLink(message: string, phone?: string): string {
  const encodedMsg = encodeURIComponent(message);
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  // If no phone is provided, it opens WhatsApp and prompts to select a contact
  return `https://wa.me/?text=${encodedMsg}`;
}
