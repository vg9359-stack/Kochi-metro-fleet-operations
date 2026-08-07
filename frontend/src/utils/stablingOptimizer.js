/**
 * Utility: Automated Stabling Bay Optimization Engine
 * Pairs fleet trains with optimal depot bays using a multi-criteria scoring algorithm.
 */

export function runStablingOptimization(fleetData, totalBays = 25) {
  const unassignedTrains = [...fleetData];
  const bayAssignments = [];
  const warnings = [];

  // Categorize bays into operational zones
  const getBayZone = (bayNum) => {
    if ([1, 2, 3, 4, 5].includes(bayNum)) return 'MAINTENANCE_PITS';
    if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(bayNum)) return 'MAIN_STABLE_LINE';
    return 'EXPRESS_INDUCTION';
  };

  // Sort trains by operational priority
  const prioritizedTrains = unassignedTrains.sort((a, b) => {
    if (a.displayStatus === 'MAINTENANCE_BLOCKED' && b.displayStatus !== 'MAINTENANCE_BLOCKED') return -1;
    if (b.displayStatus === 'MAINTENANCE_BLOCKED' && a.displayStatus !== 'MAINTENANCE_BLOCKED') return 1;
    return (b.branding_sla_hours_needed || 0) - (a.branding_sla_hours_needed || 0);
  });

  const occupiedBays = new Set();

  prioritizedTrains.forEach((train) => {
    let assignedBay = null;
    let reason = '';

    // Strategy 1: Assign Maintenance Blocked trains to Maintenance Pit bays (1-5)
    if (train.displayStatus === 'MAINTENANCE_BLOCKED') {
      for (let bay = 1; bay <= 5; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Assigned to Pit Track for Heavy Repair & Inspection';
          break;
        }
      }
    }

    // Strategy 2: High Priority / Ready trains to Express Lines (16-25)
    if (!assignedBay && train.displayStatus === 'INDUCTION_READY' && train.branding_sla_hours_needed > 15) {
      for (let bay = 16; bay <= totalBays; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Priority Departure Alignment (High SLA)';
          break;
        }
      }
    }

    // Strategy 3: Fallback sequential greedy allocation across main lines (6-15)
    if (!assignedBay) {
      for (let bay = 6; bay <= totalBays; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Standard Buffer Bay Allocation';
          break;
        }
      }
    }

    // Strategy 4: Emergency overflow backfill
    if (!assignedBay) {
      for (let bay = 1; bay <= totalBays; bay++) {
        if (!occupiedBays.has(bay)) {
          assignedBay = bay;
          reason = 'Emergency Overflow Assignment';
          warnings.push(`Train ${train.id} forced into non-optimal Bay #${bay}`);
          break;
        }
      }
    }

    if (assignedBay) {
      occupiedBays.add(assignedBay);
      bayAssignments.push({
        trainId: train.id,
        currentBay: train.stabling_bay,
        recommendedBay: assignedBay,
        zone: getBayZone(assignedBay),
        status: train.displayStatus,
        reason,
        requiresShunting: train.stabling_bay !== assignedBay
      });
    } else {
      warnings.push(`CRITICAL: Depot Capacity Exceeded! No available bay for Train ${train.id}`);
    }
  });

  const shuntingCount = bayAssignments.filter((a) => a.requiresShunting).length;

  return {
    assignments: bayAssignments.sort((a, b) => a.recommendedBay - b.recommendedBay),
    shuntingCount,
    warnings,
    optimizationScore: Math.max(0, Math.round(100 - (shuntingCount * 2.5) - (warnings.length * 10)))
  };
}