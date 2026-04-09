const checkRefundEligibility = ({
  completion,
  score,
  cheatingFlag,
  purchaseDate,
  rules,
}) => {
  if (!rules) {
    return false;
  }

  const withinTime =
    (Date.now() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24) <=
    rules.timeLimitDays;

  if (
    completion < rules.minCompletion ||
    score < rules.minScore ||
    cheatingFlag ||
    !withinTime
  ) {
    return false;
  }

  return true;
};

const calculateRefundAmount = (score, price, tiers = []) => {
  const orderedTiers = [...tiers].sort((a, b) => b.minScore - a.minScore);
  const matchedTier = orderedTiers.find((tier) => score >= tier.minScore);
  const percent = matchedTier?.refundPercent || 0;

  return (price * percent) / 100;
};

module.exports = {
  checkRefundEligibility,
  calculateRefundAmount,
};
