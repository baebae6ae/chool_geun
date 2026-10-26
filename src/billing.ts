/**
 * Google Play 인앱 결제 (개발자 응원용 소모성 상품). 안드로이드 앱에서만 된다.
 * 사면 바로 소진(consume)해서 같은 상품을 다시 살 수 있게 한다. 서버 없이 기기에서 처리한다.
 */
import { isNative } from './platform';

/** 개발용: ?fakepay 로 브라우저에서 결제 흐름을 흉내 낸다 */
const fake = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('fakepay');

export const billingAvailable = isNative || fake;

export type BuyResult = 'ok' | 'cancel' | 'fail';

async function plugin() {
  return import('@capgo/native-purchases');
}

/** 스토어에 등록된 현지 가격 (상품 ID → '₩1,500') */
export async function loadPrices(ids: string[]): Promise<Record<string, string>> {
  if (!isNative) return {};
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const { products } = await NativePurchases.getProducts({ productIdentifiers: ids, productType: PURCHASE_TYPE.INAPP });
    return Object.fromEntries(products.map((p) => [p.identifier, p.priceString]));
  } catch {
    return {};
  }
}

export async function buy(id: string): Promise<BuyResult> {
  if (fake) return new Promise((ok) => setTimeout(() => ok('ok'), 600));
  if (!billingAvailable) return 'fail';
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) return 'fail';
    await NativePurchases.purchaseProduct({ productIdentifier: id, productType: PURCHASE_TYPE.INAPP, quantity: 1, isConsumable: true });
    return 'ok';
  } catch (e) {
    return /cancel/i.test(String((e as Error)?.message ?? e)) ? 'cancel' : 'fail';
  }
}

/**
 * 결제는 됐는데 앱이 꺼져서 소진하지 못한 후원이 있으면 마저 소진한다 (그래야 다시 살 수 있다).
 * 마저 처리한 개수를 돌려준다 (그만큼 응원 기록을 남긴다).
 */
export async function settlePending(ids: string[]): Promise<number> {
  if (!isNative) return 0;
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    let n = 0;
    for (const t of purchases) {
      if (!ids.includes(t.productIdentifier) || t.purchaseState !== '1' || !t.purchaseToken) continue;
      await NativePurchases.consumePurchase({ purchaseToken: t.purchaseToken });
      n++;
    }
    return n;
  } catch {
    return 0;
  }
}
