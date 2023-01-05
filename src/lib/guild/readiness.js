const Readiness = Object.freeze({
  READY: 0,
  MAYBE_READY: 1,
  NOT_READY: 2,
});

const SHAAK_TROOPER_IDS = ['SHAAKTI', 'CT7567', 'CT210408', 'CT5555', 'ARCTROOPER501ST'];
const BAD_BATCH_IDS = ['BADBATCHHUNTER', 'BADBATCHECHO', 'BADBATCHTECH', 'BADBATCHWRECKER', 'BADBATCHOMEGA'];
const KAM_MINIMUM_POWER = 22000;
const KAM_RECOMMENDED_RELIC = 5;

function KAMReadiness(ggAccountData) {
  let shaakTroopers = [];
  let badBatch = [];

  for (const unit of ggAccountData.units) {
    // Shaak 501st check
    if (SHAAK_TROOPER_IDS.includes(unit.data.base_id)) {
      // Must exceed minimum power requirement
      if (unit.data.power < KAM_MINIMUM_POWER) {
        shaakTroopers.push(Readiness.NOT_READY);
        // if badBatch also has a failed character, exit early
        if (Math.max(...badBatch) === Readiness.NOT_READY) return Readiness.NOT_READY;
      }
      // Not at recommended relic, but enough power to attempt.
      else if (unit.data.relic_tier - 2 < KAM_RECOMMENDED_RELIC) shaakTroopers.push(Readiness.MAYBE_READY);
      // Exceeds recommended minimum relic level and has enough power to attempt mission
      else shaakTroopers.push(Readiness.READY);

      // end loop if we've looked at all necessary characters
      if (shaakTroopers.length === SHAAK_TROOPER_IDS.length && badBatch.length === BAD_BATCH_IDS.length) break;
    }

    // Bad Batch check
    if (BAD_BATCH_IDS.includes(unit.data.base_id)) {
      if (unit.data.power < KAM_MINIMUM_POWER) {
        // Must exceed minimum power requirement
        badBatch.push(Readiness.NOT_READY);
        // if shaakTroopers also has a failed character, exit early
        if (Math.max(...shaakTroopers) === Readiness.NOT_READY) return Readiness.NOT_READY;
      }
      // Not at recommended relic, but enough power to attempt.
      else if (unit.data.relic_tier - 2 < KAM_RECOMMENDED_RELIC) badBatch.push(Readiness.MAYBE_READY);
      // Exceeds recommended minimum relic level and has enough power to attempt mission
      else badBatch.push(Readiness.READY);

      // end loop if we've looked at all necessary characters
      if (shaakTroopers.length === SHAAK_TROOPER_IDS.length && badBatch.length === BAD_BATCH_IDS.length) break;
    }
  }

  // if we didn't find a character, push not ready into array
  if (shaakTroopers.length < SHAAK_TROOPER_IDS.length) shaakTroopers.push(Readiness.NOT_READY);
  if (badBatch.length < BAD_BATCH_IDS.length) badBatch.push(Readiness.NOT_READY);

  // return best case of bad batch and shaak trooper options using worst case from each.
  return Math.min(Math.max(...shaakTroopers), Math.max(...badBatch));
}

const GEO_IDS = ['GEONOSIANBROODALPHA', 'SUNFAC', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'POGGLETHELESSER'];
const WAT_MINIMUM_POWER = 16500;
const WAT_RECOMMENDED_GEAR = 12;

function WatReadiness(ggAccountData) {
  let geos = [];

  for (const unit of ggAccountData.units) {
    if (GEO_IDS.includes(unit.data.base_id)) {
      // if a geo fails, we can exit early
      if (unit.data.power < WAT_MINIMUM_POWER) return Readiness.NOT_READY;
      // exceeds power level, but low gear.
      else if (unit.data.gear_level < WAT_RECOMMENDED_GEAR) geos.push(Readiness.MAYBE_READY);
      // Exceeds power level requirement and minimum recommended gear
      else geos.push(Readiness.READY);

      if (geos.length === GEO_IDS.length) break; // end loop if we've looked at all necessary characters
    }
  }

  // couldn't find at least one character, exit early
  if (geos.length < GEO_IDS.length) return Readiness.NOT_READY;

  return Math.max(...geos); // returns worst case geo for readiness indicator
}

const GI = 'GRANDINQUISITOR';
const INQUISITOR_IDS = ['EIGHTHBROTHER', 'FIFTHBROTHER', 'NINTHSISTER', 'SECONDSISTER', 'SEVENTHSISTER', 'THIRDSISTER'];
const REVA_REQUIRED_RELIC = 7;
const INQUISITORS_NEEDED = 4;

function RevaReadiness(ggAccountData) {
  let GIPass = false;
  let inquisitorsSeen = 0;
  let inquisitorsPass = 0;

  for (const unit of ggAccountData.units) {
    // Grand Inquisitor Check
    if (!GIPass && unit.data.base_id === GI) {
      // If GI fails the check, we are done
      if (unit.data.relic_tier - 2 < REVA_REQUIRED_RELIC) return Readiness.NOT_READY;

      GIPass = true;

      // if we've seen GI and all inquisitors we need to check (or enough have passed), we can break out of the loop.
      if (inquisitorsSeen === INQUISITOR_IDS.length || inquisitorsPass >= INQUISITORS_NEEDED) break;

      // leave once we know we don't have enough inquisitors to pass
      if (INQUISITOR_IDS.length - inquisitorsSeen + inquisitorsPass < INQUISITORS_NEEDED) return Readiness.NOT_READY;
    }

    // Inquisitor check
    if (INQUISITOR_IDS.includes(unit.data.base_id)) {
      inquisitorsSeen++; // increase number seen

      // if above R7, increase passing counter
      if (unit.data.relic_tier - 2 >= REVA_REQUIRED_RELIC) inquisitorsPass++;

      // if we've seen GI and all inquisitors we need to check (or enough have passed), we can break out of the loop.
      if (GIPass && (inquisitorsSeen === INQUISITOR_IDS.length || inquisitorsPass >= INQUISITORS_NEEDED)) break;

      // leave once we know we don't have enough inquisitors to pass
      if (INQUISITOR_IDS.length - inquisitorsSeen + inquisitorsPass < INQUISITORS_NEEDED) return Readiness.NOT_READY;
    }
  }

  // if we have GI and at least 4 inquisitors, technically ready, otherwise not.
  return GIPass && inquisitorsPass >= INQUISITORS_NEEDED ? Readiness.READY : Readiness.NOT_READY;
}

function GetReadinessFunction(character) {
  switch (character) {
    case 'Wat Tambor':
      return WatReadiness;
    case 'Ki-Adi-Mundi':
      return KAMReadiness;
    case 'Third Sister':
      return RevaReadiness;
    default:
      return null;
  }
}

export { Readiness, WatReadiness, KAMReadiness, RevaReadiness, GetReadinessFunction };
