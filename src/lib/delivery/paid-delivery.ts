import type { ReceizCommerceAdapter } from "../receiz/adapter";
import { recoverOriginalOrder, type OrderRecoveryCoordinates } from "../checkout/order-recovery";
import { openProductDeliverySource } from "./native-delivery";

export async function openPaidOrderDelivery(input: {
  receiz: ReceizCommerceAdapter; coordinates: OrderRecoveryCoordinates;
  reader: { handle?: string; userId?: string }; secret?: string;
}) {
  const recovered = await recoverOriginalOrder(input);
  if (!recovered.settlement.paid || !recovered.order) throw new Error("delivery_payment_not_settled");
  const sources = recovered.quote.items.filter(item => item.deliverySource);
  if (!sources.length) throw new Error("delivery_source_unavailable");
  // Verify every purchased source before returning any bytes. The quote, rather
  // than today's editable catalog, retains the exact purchased file.
  const files = [];
  for (const item of sources) {
    const file = await openProductDeliverySource({ receiz: input.receiz, source: item.deliverySource!, secret: input.secret,
      binding: { merchantReceizId: recovered.quote.merchantReceizId, productId: item.id } });
    files.push({ productId: item.id, title: item.title, ...file });
  }
  return { order: recovered.order, files };
}
