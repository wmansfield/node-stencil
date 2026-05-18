export interface AgePolicy {
   consent_required_below: number;
   minimum_age: number;
}

const DEFAULT_POLICY: AgePolicy = {
   consent_required_below: 16,
   minimum_age: 13,
};

const JURISDICTION_POLICIES: Record<string, AgePolicy> = {
   US: { consent_required_below: 16, minimum_age: 13 },
   CA: { consent_required_below: 16, minimum_age: 13 },
   GB: { consent_required_below: 16, minimum_age: 13 },
   DE: { consent_required_below: 16, minimum_age: 13 },
   FR: { consent_required_below: 15, minimum_age: 13 },
   IT: { consent_required_below: 14, minimum_age: 13 },
   ES: { consent_required_below: 14, minimum_age: 13 },
   NL: { consent_required_below: 16, minimum_age: 13 },
   IE: { consent_required_below: 16, minimum_age: 13 },
   AT: { consent_required_below: 14, minimum_age: 13 },
   DK: { consent_required_below: 13, minimum_age: 13 },
};

/**
 * Returns the age policy for a given jurisdiction. The jurisdiction_id is
 * expected to be a 2-letter ISO country code (matching how jurisdictions
 * are keyed in the system).
 */
export function getAgePolicy(jurisdictionId: string): AgePolicy {
   return JURISDICTION_POLICIES[jurisdictionId.toUpperCase()] ?? DEFAULT_POLICY;
}
