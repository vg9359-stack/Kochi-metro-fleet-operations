/**
 * Utility: Automated Stabling Bay Optimization Engine
 * Pairs fleet trains with optimal depot bays using a multi-criteria scoring algorithm.
 */

export function runStablingOptimization(fleetData, totalBays = 25) {
  // Safe extraction of array data
  const rawData = Array.isArray(fleetData)
    ? fleetData
    : fleetData && Array.isArray(fleetData.trains)
    ? fleetData.trains
    : [];

  // Filter out any null/undefined train entries
  const safeFleet = rawData.filter((item) => item && typeof item === 'object');

  const bayAssignments = [];
  const warnings = [];

  const getBayZone = (bayNum) => {
    if ([1, 2, 3, 4, 5].includes(bayNum)) return 'MAINTENANCE_PITS';
    if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(bayNum)) return 'MAIN_STABLE_LINE';
    return 'EXPRESS_INDUCTION';
  };

  const parseBayNumber = (bayVal) => {
    if (typeof bayVal === 'number') return bayVal;
    if (typeof bayVal === 'string') {
      const match = bayVal.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    }
    return null;
  };

  // Safe sort handling missing properties
  const prioritizedTrains = [...safeFleet].sort((a, b) => {
    const aBlocked = a?.displayStatus === 'MAINTENANCE_BLOCKED';
    const bBlocked = b?.displayStatus === 'MAINTENANCE_BLOCKED';
    if (aBlocked && !bBlocked) return -1;
    if (bBlocked && !aBlocked) return 1;
    return (b?.branding_sla_hours_needed || 0) - (a?.branding_sla_hours_needed || 0);
  });

  const occupiedBays = new Set();

  prioritizedTrains.forEach((train) => {
    if (!train) return;

    let assignedBay = null;
    let reason = '';

    const trainId = train.id || train.trainId || `TS-${Math.floor(Math.random() * 900 + 100)}`;
    const displayStatus = train.displayStatus || 'INDUCTION_READY';
    const currentBayNum = parseBayNumber(train.stabling_bay || train.currentBay);

    // Prefer keeping train in current bay if zone fits operational state
    if (
      currentBayNum &&
      !occupiedBays.has(currentBayNum) &&
      currentBayNum >= 1 &&
      currentBayNum <= totalBays
    ) {
      const currentZone = getBayZone(currentBayNum);

      if (
        (displayStatus === 'MAINTENANCE_BLOCKED' && currentZone === 'MAINTENANCE_PITS') ||
        (displayStatus === 'INDUCTION_READY' && (train.branding_sla_hours_needed || 0) > 15 && currentZone === 'EXPRESS_INDUCTION') ||
        (displayStatus === 'INDUCTION_READY' && currentZone === 'MAIN_STABLE_LINE')
      ) {
        assignedBay = currentBayNum;
        reason = 'Optimal In-Place Allocation (Zero Shunt Required)';
      }
    }

    // Strategy 1: Maintenance Pit bays (1-5)
    if (!assignedBay && displayStatus === 'MAINTENANCE_BLOCKED') {
      for (let bay = 1; bay <= 5; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Assigned to Pit Track for Heavy Repair & Inspection';
          break;
        }
      }
    }

    // Strategy 2: High SLA Express Lines (16-25)
    if (!assignedBay && displayStatus === 'INDUCTION_READY' && (train.branding_sla_hours_needed || 0) > 15) {
      for (let bay = 16; bay <= totalBays; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Priority Departure Alignment (High SLA)';
          break;
        }
      }
    }

    // Strategy 3: Standard allocation (6-15)
    if (!assignedBay) {
      for (let bay = 6; bay <= totalBays; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Standard Buffer Bay Allocation';
          break;
        }
      }
    }

    // Strategy 4: Fallback
    if (!assignedBay) {
      for (let bay = 1; bay <= totalBays; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Emergency Overflow Assignment';
          warnings.push(`Train ${trainId} forced into non-optimal Bay #${bay}`);
          break;
        }
      }
    }

    if (assignedBay) {
      occupiedBays.add(assignedBay);
      const requiresShunting = currentBayNum !== assignedBay;

      bayAssignments.push({
        trainId,
        currentBay: currentBayNum ? `Bay #${currentBayNum}` : 'Unassigned',
        recommendedBay: `Bay #${assignedBay}`,
        bayNumber: assignedBay,
        zone: getBayZone(assignedBay),
        status: displayStatus,
        reason,
        requiresShunting,
        shuntingStatus: requiresShunting ? 'Shunt Required' : 'In Position'
      });
    } else {
      warnings.push(`CRITICAL: Depot Capacity Exceeded! No available bay for Train ${trainId}`);
    }
  });

  const shuntingCount = bayAssignments.filter((a) => a.requiresShunting).length;

  return {
    assignments: bayAssignments.sort((a, b) => a.bayNumber - b.bayNumber),
    shuntingCount,
    warnings,
    optimizationScore: Math.max(0, Math.round(100 - (shuntingCount * 2.5) - (warnings.length * 10)))
  };
}