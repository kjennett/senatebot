const Readiness = Object.freeze({
  READY: 0,
  MAYBE_READY: 1,
  NOT_READY: 2,
});

exports.Readiness = Readiness;

const shaakTrooperIDs = ['SHAAKTI', 'CT7567', 'CT210408', 'CT5555', 'ARCTROOPER501ST'];
const badBatchIDs = ['BADBATCHHUNTER', 'BADBATCHECHO', 'BADBATCHTECH', 'BADBATCHWRECKER', 'BADBATCHOMEGA'];
const KAM_MINIMUM_POWER_LEVEL = 22000;
const KAM_RECOMMENDED_RELIC_TIER = 5;

exports.KAMReadiness = (ggAccountData) => {
  let shaakTroopers = [];
  let shaakTroopersFailed = false;
  let badBatch = [];
  let badBatchFailed = false;

  for (let i = 0; i < ggAccountData.units.length; i++) {
    const unit = ggAccountData.units[i];
    if (shaakTrooperIDs.includes(unit.data.base_id)) {
      // can't be under minimum power level
      if (unit.data.power < KAM_MINIMUM_POWER_LEVEL) {
        shaakTroopers.push(Readiness.NOT_READY);
        shaakTroopersFailed = true;

        // if both have failed, exit early
        if (badBatchFailed) return Readiness.NOT_READY;
      }
      // under recommended relic is questionable
      else if (unit.data.relic_tier - 2 < KAM_RECOMMENDED_RELIC_TIER) shaakTroopers.push(Readiness.MAYBE_READY);
      else shaakTroopers.push(Readiness.READY); // okay

      // if we've seen everyone, break out of the loop
      if (shaakTroopers.length === shaakTrooperIDs.length && badBatch.length === badBatchIDs.length) break;
    } else if (badBatchIDs.includes(unit.data.base_id)) {
      // can't be under minimum power level
      if (unit.data.power < KAM_MINIMUM_POWER_LEVEL) {
        badBatch.push(Readiness.NOT_READY);
        badBatchFailed = true;

        // if both have failed, exit early
        if (shaakTroopersFailed) return Readiness.NOT_READY;
      }
      // under recommended relic is questionable
      else if (unit.data.relic_tier - 2 < KAM_RECOMMENDED_RELIC_TIER) badBatch.push(Readiness.MAYBE_READY);
      else badBatch.push(Readiness.READY); // okay

      // if we've seen everyone, break out of the loop
      if (shaakTroopers.length === shaakTrooperIDs.length && badBatch.length === badBatchIDs.length) break;
    }
  }

  // if we haven't seen a necessary character for a team, push a not ready
  if (shaakTroopers.length < shaakTrooperIDs.length) shaakTroopers.push(Readiness.NOT_READY);
  if (badBatch.length < badBatchIDs.length) badBatch.push(Readiness.NOT_READY);

  // return best case of the worst cases from shaak troopers and bad batch options
  return Math.min(Math.max(...shaakTroopers), Math.max(...badBatch))
}

const geoIDs = ['GEONOSIANBROODALPHA', 'SUNFAC', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'POGGLETHELESSER'];
const WAT_MINIMUM_POWER_LEVEL = 16500;
const WAT_RECOMMENDED_GEAR_LEVEL = 12;

exports.WatReadiness = (ggAccountData) => {
  let geos = [];
  for (let i = 0; i < ggAccountData.units.length; i++) {
    const unit = ggAccountData.units[i];
    if (geoIDs.includes(unit.data.base_id)) {
      // can't be under minimum power level
      if (unit.data.power < WAT_MINIMUM_POWER_LEVEL) return Readiness.NOT_READY;
      // under recommended minimum gear level is questionable
      else if (unit.data.gear_level < WAT_RECOMMENDED_GEAR_LEVEL) geos.push(Readiness.MAYBE_READY);
      else geos.push(Readiness.READY); // should be okay

      // if we've seen everyone, break out of the loop
      if (geos.length === geoIDs.length) break;
    }
  }

  if (geos.length < geoIDs.length) return Readiness.NOT_READY; // missing someone, not ready
  else return Math.max(...geos); // returns worst case geo as readiness indicator
}

const GI = 'GRANDINQUISITOR';
const inquisitors = [
  'EIGHTHBROTHER',
  'FIFTHBROTHER',
  'NINTHSISTER',
  'SECONDSISTER',
  'SEVENTHSISTER',
  'THIRDSISTER'
];
const REVA_MINIMUM_RELIC_TIER = 7;
const INQUISITORS_NEEDED = 4;

exports.RevaReadiness = (ggAccountData) => {
  let GIPass = false;
  let inquisitorsSeen = 0;
  let inquisitorsPass = 0;

  for (let i = 0; i < ggAccountData.units.length; i++) {
    const unit = ggAccountData.units[i];
    if (!GIPass && unit.data.base_id === GI) {
      // Grand Inquisitor Check - if he fails the relic requirement, we're done
      if (unit.data.relic_tier - 2 < REVA_MINIMUM_RELIC_TIER) return Readiness.NOT_READY;
      GIPass = true;

      // we've seen GI and if all inquisitors we need to check (or 4 have passed), we can break out of the loop.
      if (inquisitorsSeen === inquisitors.length || inquisitorsPass >= INQUISITORS_NEEDED) break;
      // short circuit if we can't reach the number of inquisitors needed with what we have and what we've seen
      if (inquisitors.length - inquisitorsSeen + inquisitorsPass < INQUISITORS_NEEDED) return Readiness.NOT_READY;
    }

    // general inquisitor check
    if (inquisitors.includes(unit.data.base_id)) {
      inquisitorsSeen++; // increase number seen

      // if above R7, increase passing counter
      if (unit.data.relic_tier - 2 >= REVA_MINIMUM_RELIC_TIER) inquisitorsPass++;

      // if GI has passed, and we've seen all inquisitors (or 4 inquisitors have passed), we're done
      if (GIPass && (inquisitorsSeen === inquisitors.length || inquisitorsPass >= INQUISITORS_NEEDED)) break;
      // short circuit if we can't reach the number of inquisitors needed with what we have and what we've seen
      if (inquisitors.length - inquisitorsSeen + inquisitorsPass < INQUISITORS_NEEDED) return Readiness.NOT_READY;
    }
  }

  // if we have GI and at least 4 inquisitors, technically ready, otherwise not.
  return GIPass && inquisitorsPass >= INQUISITORS_NEEDED ? Readiness.READY : Readiness.NOT_READY;
}