const completedStatus = status => ['released', 'paid', 'confirmed', 'completed'].includes(String(status).toLowerCase());

export const toProviderTransactions = entries => (entries || [])
  .filter(entry => entry.role === 'provider' && ['provider_payout', 'provider_withdrawal'].includes(entry.type))
  .map(entry => ({
    id: entry.id,
    amount: entry.type === 'provider_withdrawal' ? -Math.abs(Number(entry.amount) || 0) : Math.abs(Number(entry.amount) || 0),
    description: entry.type === 'provider_withdrawal' ? 'Payout request' : 'Managed service payout',
    date: entry.at ? new Date(entry.at).toLocaleDateString() : 'Date unavailable',
    timestamp: entry.at || '',
    method: entry.method || 'Payout ledger',
    jobType: entry.caseId || 'Managed service',
    status: entry.type === 'provider_withdrawal' ? 'pending' : completedStatus(entry.status) ? 'completed' : entry.status === 'failed' ? 'failed' : 'pending',
  }));

export const summarizeProviderEarnings = (entries, now = new Date()) => {
  const providerEntries = (entries || []).filter(entry => entry.role === 'provider' && entry.type === 'provider_payout');
  const paid = providerEntries.filter(entry => completedStatus(entry.status));
  const pending = providerEntries.filter(entry => !completedStatus(entry.status) && entry.status !== 'failed');
  const withdrawals = (entries || []).filter(entry => entry.role === 'provider' && entry.type === 'provider_withdrawal');
  const withinDays = (entry, days) => {
    const timestamp = Date.parse(entry.at);
    return Number.isFinite(timestamp) && timestamp >= now.getTime() - days * 86400000 && timestamp <= now.getTime();
  };
  const sum = list => list.reduce((total, item) => total + Math.abs(Number(item.amount) || 0), 0);
  const thisWeek = paid.filter(entry => withinDays(entry, 7));
  const lastWeek = paid.filter(entry => {
    const timestamp = Date.parse(entry.at);
    return Number.isFinite(timestamp) && timestamp >= now.getTime() - 14 * 86400000 && timestamp < now.getTime() - 7 * 86400000;
  });
  const thisMonth = paid.filter(entry => withinDays(entry, 30));
  const lastMonth = paid.filter(entry => {
    const timestamp = Date.parse(entry.at);
    return Number.isFinite(timestamp) && timestamp >= now.getTime() - 60 * 86400000 && timestamp < now.getTime() - 30 * 86400000;
  });
  const thisYear = paid.filter(entry => withinDays(entry, 365));
  const chart = (days, bucketCount) => Array.from({ length: bucketCount }, (_, index) => {
    const end = new Date(now.getTime() - (bucketCount - index - 1) * (days / bucketCount) * 86400000);
    const span = days / bucketCount;
    const startTime = end.getTime() - span * 86400000;
    const matching = paid.filter(entry => {
      const timestamp = Date.parse(entry.at);
      return Number.isFinite(timestamp) && timestamp > startTime && timestamp <= end.getTime();
    });
    return { name: end.toLocaleDateString(undefined, days > 90 ? { month: 'short' } : { month: 'short', day: 'numeric' }), earnings: sum(matching), jobs: matching.length };
  });
  return {
    thisWeek: sum(thisWeek), lastWeek: sum(lastWeek), thisMonth: sum(thisMonth), lastMonth: sum(lastMonth), thisYear: sum(thisYear), lastYear: 0,
    pending: sum(pending), available: Math.max(0, sum(paid) - sum(withdrawals)),
    weeklyData: chart(7, 7), monthlyData: chart(30, 6), yearlyData: chart(365, 12),
    chartData: { week: chart(7, 7), month: chart(30, 6), year: chart(365, 12) },
    totalJobs: { thisWeek: thisWeek.length, thisMonth: thisMonth.length, thisYear: thisYear.length },
    goals: { monthly: 0, yearly: 0 },
  };
};
