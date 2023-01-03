const Readiness = Object.freeze({
  READY: 0,
  MAYBE_READY: 1,
  NOT_READY: 2,
});

exports.Readiness = Readiness;

const shaakTrooperIDs = ['SHAAKTI', 'CT7567', 'CT210408', 'CT5555', 'ARCTROOPER501ST'];
// const badBatchIDs = ['BADBATCHHUNTER', 'BADBATCHECHO', 'BADBATCHTECH', 'BADBATCHWRECKER', 'BADBATCHOMEGA'];
const KAM_MINIMUM_POWER_LEVEL = 22000;
const KAM_RECOMMENDED_RELIC_TIER = 5;

exports.KAMReadiness = (ggAccountData) => {
  let shaakTroopers = [];
  // let badBatch = [];

  for (let i = 0; i < ggAccountData.units.length; i++) {
    const unit = ggAccountData.units[i];
    if (shaakTrooperIDs.includes(unit.data.base_id)) {
      // if (unit.data.power < KAM_MINIMUM_POWER_LEVEL) shaakTroopers.push(Readiness.NOT_READY);
      if (unit.data.power < KAM_MINIMUM_POWER_LEVEL) return Readiness.NOT_READY; // not checking BB, can short circuit here
      else if (unit.data.relic_tier - 2 < KAM_RECOMMENDED_RELIC_TIER) shaakTroopers.push(Readiness.MAYBE_READY);
      else shaakTroopers.push(Readiness.READY);

      // end loop if we've looked at all necessary characters
      // if (shaakTroopers.length === shaakTrooperIDs.length && badBatch.length === badBatchIDs.length) break;
      if (shaakTroopers.length === shaakTrooperIDs.length) break;
    }
    // if (badBatchIDs.includes(unit.data.base_id)) {
    //   if (unit.data.power < KAM_MINIMUM_POWER_LEVEL) badBatch.push(Readiness.NOT_READY);
    //   else if (unit.data.relic_tier - 2 < KAM_RECOMMENDED_RELIC_TIER) badBatch.push(Readiness.MAYBE_READY);
    //   else badBatch.push(Readiness.READY);
    //
    //   // end loop if we've looked at all necessary characters
    //   if (shaakTroopers.length === shaakTrooperIDs.length && badBatch.length === badBatchIDs.length) break;
    // }
  }

  // if we didn't find a character, not ready
  // if (shaakTroopers.length < shaakTrooperIDs.length) shaakTroopers.push(Readiness.NOT_READY);
  // if (badBatch.length < badBatchIDs.length) badBatch.push(Readiness.NOT_READY);

  // return best case of bad batch and shaak trooper options using worst case from each.
  // return Math.min(Math.max(...shaakTroopers), Math.max(...badBatch));

  if (shaakTroopers.length < shaakTrooperIDs.length) return Readiness.NOT_READY;
  else return Math.max(...shaakTroopers);
}

const geoIDs = ['GEONOSIANBROODALPHA', 'SUNFAC', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'POGGLETHELESSER'];
const WAT_MINIMUM_POWER_LEVEL = 16500;
const WAT_RECOMMENDED_GEAR_LEVEL = 12;

exports.WatReadiness = (ggAccountData) => {
  let geos = [];
  for (let i = 0; i < ggAccountData.units.length; i++) {
    const unit = ggAccountData.units[i];
    if (geoIDs.includes(unit.data.base_id)) {
      if (unit.data.power < WAT_MINIMUM_POWER_LEVEL) return Readiness.NOT_READY; // worst case, not ready, can short circuit
      else if (unit.data.gear_level < WAT_RECOMMENDED_GEAR_LEVEL) geos.push(Readiness.MAYBE_READY); // maybe ready
      else geos.push(Readiness.READY); // Should be ready

      if (geos.length === geoIDs.length) break; // end loop if we've looked at all necessary characters
    }
  }

  if (geos.length < geoIDs.length) return Readiness.NOT_READY; // missing someone, not ready
  else return Math.max(...geos); // returns worst case geo for readiness indicator
}

const GI = 'GRANDINQUISITOR';
const inquisitors = ['EIGHTHBROTHER', 'FIFTHBROTHER', 'NINTHSISTER', 'SECONDSISTER', 'SEVENTHSISTER', 'THIRDSISTER'];
const REVA_MINIMUM_RELIC_TIER = 7;

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

      // if we've seen GI and all inquisitors we need to check (or 4 have passed), we can break out of the loop.
      if (inquisitorsSeen === inquisitors.length || inquisitorsPass >= 4) break;
    }

    if (inquisitors.includes(unit.data.base_id)) {
      // general inquisitor check
      inquisitorsSeen++; // increase number seen
      if (unit.data.relic_tier - 2 >= REVA_MINIMUM_RELIC_TIER) inquisitorsPass++; // if above R7, increase passing counter

      // if GI has passed, and we've seen all inquisitors (or 4 inquisitors have passed), we're done
      if (GIPass && (inquisitorsSeen === inquisitors.length || inquisitorsPass >= 4)) break;
    }
  }

  // if we have GI and at least 4 inquisitors, technically ready, otherwise not.
  return GIPass && inquisitorsPass >= 4 ? Readiness.READY : Readiness.NOT_READY;
}