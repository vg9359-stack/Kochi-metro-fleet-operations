/**
 * Utility: Predictive Maintenance Analytics & Risk Forecasting
 * Simulates a multi-variable regression model for transit rolling stock.
 */

export function calculateTrainHealthMetrics(train) {
  const mileage = train.mileage_km || 15000;
  const hvacHours = train.hvac_hours || (mileage * 0.08);
  const brakeWearPct = train.brake_wear_pct || Math.min(95, Math.round((mileage / 60000) * 100));
  const motorTempC = train.motor_temp_c || 65 + (mileage % 25);

  // Weighted risk contribution calculation (0 to 100 scale)
  const mileageWeight = 0.35;
  const brakeWearWeight = 0.30;
  const tempWeight = 0.20;
  const hvacWeight = 0.15;

  const mileageScore = Math.min(100, (mileage / 50000) * 100);
  const brakeScore = brakeWearPct;
  const tempScore = Math.max(0, Math.min(100, ((motorTempC - 50) / 45) * 100));
  const hvacScore = Math.min(100, (hvacHours / 4000) * 100);

  // Overall Failure Risk Index (%)
  let riskScore = Math.round(
    mileageScore * mileageWeight +
    brakeScore * brakeWearWeight +
    tempScore * tempWeight +
    hvacScore * hvacWeight
  );

  // Hard overrides for manual blocked or standby statuses
  if (train.displayStatus === 'MAINTENANCE_BLOCKED') {
    riskScore = Math.max(88, riskScore);
  }

  // Determine operational category
  let riskLevel = 'LOW';
  let badgeColor = 'bg-teal-500/20 text-teal-400 border-teal-500/30';
  
  if (riskScore >= 75) {
    riskLevel = 'CRITICAL';
    badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  } else if (riskScore >= 45) {
    riskLevel = 'MODERATE';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }

  // Estimated Remaining Useful Life (in operational hours)
  const remainingHours = Math.max(0, Math.round((100 - riskScore) * 18.5));

  // Top component failure contributor
  const componentScores = [
    { name: 'Brake Pad Assembly', score: brakeScore },
    { name: 'Traction Motor Thermal', score: tempScore },
    { name: 'HVAC Compressor', score: hvacScore },
    { name: 'Wheelsets / Axles', score: mileageScore }
  ];
  componentScores.sort((a, b) => b.score - a.score);

  return {
    riskScore,
    riskLevel,
    badgeColor,
    remainingHours,
    topRiskFactor: componentScores[0].name,
    brakeWearPct,
    motorTempC,
    mileage
  };
}