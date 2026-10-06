// Constant-notional illustration: percentages use percentage points, not decimals.
// Compare price travel to the same net equity target, not a time forecast.
export function executionMetrics(feePercent, leverage, targetPercent = 10, riskPercent = 3) {
  if (feePercent == null || leverage == null || !Number.isFinite(feePercent) || !Number.isFinite(leverage) || feePercent < 0 || leverage <= 0 || !Number.isFinite(targetPercent) || targetPercent <= 0 || !Number.isFinite(riskPercent) || riskPercent <= 0) {
    return { feeDrag: null, requiredMove: null, stopMove: null, reach: null };
  }
  const feeDrag = 2 * feePercent * leverage;
  const requiredMove = (targetPercent + feeDrag) / leverage;
  // A losing exit pays the same round-trip fee. The price stop must leave
  // enough of the equity risk budget to cover those fees.
  const stopMove = (riskPercent - feeDrag) / leverage;
  return { feeDrag, requiredMove, stopMove: stopMove > 0 ? stopMove : null, reach: 1 / requiredMove };
}
