/**
 * 연봉 → 세후 월 실수령액 추정 (한국, 2026년 요율 기준 근사치).
 * 실제 급여명세서는 간이세액표·회사별 수당·연말정산에 따라 조금씩 다르다.
 */

export interface NetOptions {
  /** 부양가족 수 (본인 포함) */
  dependents: number;
  /** 월 비과세 식대 등 */
  mealAllowance: number;
  /** 연봉에 퇴직금이 포함돼 있으면 13으로 나눈다 */
  severanceIncluded: boolean;
}

export interface NetBreakdown {
  grossMonthly: number;
  pension: number;
  health: number;
  care: number;
  employment: number;
  incomeTax: number;
  localTax: number;
  netMonthly: number;
}

const PENSION_RATE = 0.045;
const PENSION_BASE_MIN = 400_000;
const PENSION_BASE_MAX = 6_370_000;
const HEALTH_RATE = 0.03595;
const CARE_RATIO = 0.1314;
const EMPLOYMENT_RATE = 0.009;

/** 근로소득공제 */
function earnedIncomeDeduction(total: number): number {
  const d =
    total <= 5_000_000
      ? total * 0.7
      : total <= 15_000_000
        ? 3_500_000 + (total - 5_000_000) * 0.4
        : total <= 45_000_000
          ? 7_500_000 + (total - 15_000_000) * 0.15
          : total <= 100_000_000
            ? 12_000_000 + (total - 45_000_000) * 0.05
            : 14_750_000 + (total - 100_000_000) * 0.02;
  return Math.min(d, 20_000_000);
}

/** 종합소득세 기본세율 */
function progressiveTax(base: number): number {
  const brackets: [number, number, number][] = [
    [14_000_000, 0, 0.06],
    [50_000_000, 840_000, 0.15],
    [88_000_000, 6_240_000, 0.24],
    [150_000_000, 15_360_000, 0.35],
    [300_000_000, 37_060_000, 0.38],
    [500_000_000, 94_060_000, 0.4],
    [1_000_000_000, 174_060_000, 0.42],
    [Infinity, 384_060_000, 0.45],
  ];
  let prev = 0;
  for (const [limit, fixed, rate] of brackets) {
    if (base <= limit) return fixed + (base - prev) * rate;
    prev = limit;
  }
  return 0;
}

/** 근로소득세액공제 (한도 포함) */
function earnedIncomeTaxCredit(tax: number, total: number): number {
  const credit = tax <= 1_300_000 ? tax * 0.55 : 715_000 + (tax - 1_300_000) * 0.3;
  const limit =
    total <= 33_000_000
      ? 740_000
      : total <= 70_000_000
        ? Math.max(660_000, 740_000 - (total - 33_000_000) * 0.008)
        : total <= 120_000_000
          ? Math.max(500_000, 660_000 - (total - 70_000_000) * 0.5)
          : Math.max(200_000, 500_000 - (total - 120_000_000) * 0.5);
  return Math.min(credit, limit);
}

export function estimateNet(annualSalary: number, o: NetOptions): NetBreakdown {
  const grossMonthly = annualSalary / (o.severanceIncluded ? 13 : 12);
  const taxableMonthly = Math.max(0, grossMonthly - Math.min(o.mealAllowance, grossMonthly));

  const pension = Math.min(Math.max(taxableMonthly, PENSION_BASE_MIN), PENSION_BASE_MAX) * PENSION_RATE;
  const health = taxableMonthly * HEALTH_RATE;
  const care = health * CARE_RATIO;
  const employment = taxableMonthly * EMPLOYMENT_RATE;

  const total = taxableMonthly * 12;
  const income = total - earnedIncomeDeduction(total);
  const base = Math.max(
    0,
    income - 1_500_000 * Math.max(1, o.dependents) - pension * 12 - (health + care + employment) * 12,
  );
  const calc = progressiveTax(base);
  const annualTax = Math.max(0, calc - earnedIncomeTaxCredit(calc, total));
  const incomeTax = annualTax / 12;
  const localTax = incomeTax * 0.1;

  const round = (v: number) => Math.round(v / 10) * 10;
  const b = {
    grossMonthly: Math.round(grossMonthly),
    pension: round(pension),
    health: round(health),
    care: round(care),
    employment: round(employment),
    incomeTax: round(incomeTax),
    localTax: round(localTax),
  };
  const netMonthly = round(b.grossMonthly - b.pension - b.health - b.care - b.employment - b.incomeTax - b.localTax);
  return { ...b, netMonthly };
}
