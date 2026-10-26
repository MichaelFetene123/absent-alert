/**
 * Ethiopian Mobile Carrier Detection & Credit Cost Calculator
 * 
 * Ethio Telecom: 09xxxxxxxx, 2519..., +2519... (Cost: 1 credit per SMS)
 * Safaricom:     07xxxxxxxx, 2517..., +2517... (Cost: 2 credits per SMS)
 */

export function detectCarrier(phone: string): {
  carrier: "Ethio Telecom" | "Safaricom" | "Unknown";
  creditCost: number;
} {
  let clean = phone.replace(/[^0-9]/g, "");
  // Normalize "+251 09..." -> "+251 9..."
  if (clean.startsWith("25109")) clean = "2519" + clean.slice(5);
  if (clean.startsWith("25107")) clean = "2517" + clean.slice(5);

  if (clean.startsWith("2519") || clean.startsWith("09") || (clean.length === 9 && clean.startsWith("9"))) {
    return { carrier: "Ethio Telecom", creditCost: 1 };
  }
  if (clean.startsWith("2517") || clean.startsWith("07") || (clean.length === 9 && clean.startsWith("7"))) {
    return { carrier: "Safaricom", creditCost: 2 };
  }
  return { carrier: "Unknown", creditCost: 1 };
}
