export const DEFAULT_PAYROLL_CURRENCY = "pUSD";

export function formatPayrollAmount(
  amount: number,
  currency: string = DEFAULT_PAYROLL_CURRENCY,
) {
  return `${Number(amount).toLocaleString()} ${currency}`;
}

export function getPayrollAmountLabel(currency: string = DEFAULT_PAYROLL_CURRENCY) {
  return `Amount (${currency})`;
}

export function getSalaryLabel(currency: string = DEFAULT_PAYROLL_CURRENCY) {
  return `Monthly Salary (${currency})`;
}
