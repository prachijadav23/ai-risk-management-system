/**
 * Deterministic resource-allocation scoring. Ranks candidate employees for a
 * project based on skill match, availability, spare workload capacity,
 * experience and performance. Same replaceable-service pattern as risk.service.
 */

export interface Candidate {
  id: string;
  name: string;
  designation: string;
  skills: string[];
  experienceYears: number;
  currentWorkload: number; // 0-100
  performanceScore: number; // 0-100
  availability: 'Available' | 'PartiallyAvailable' | 'Unavailable';
}

export interface AllocationScore {
  id: string;
  name: string;
  designation: string;
  fitScore: number; // 0-100
  skillMatchPct: number;
  spareCapacity: number;
  breakdown: { label: string; value: number }[];
  matchedSkills: string[];
  missingSkills: string[];
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const round = (n: number) => Math.round(n * 10) / 10;

const AVAILABILITY_SCORE: Record<Candidate['availability'], number> = {
  Available: 100,
  PartiallyAvailable: 55,
  Unavailable: 10,
};

const WEIGHTS = {
  skill: 0.4,
  availability: 0.2,
  capacity: 0.2,
  experience: 0.1,
  performance: 0.1,
};

export function scoreCandidates(
  requiredSkills: string[],
  candidates: Candidate[]
): AllocationScore[] {
  const req = requiredSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  const scored = candidates.map((c) => {
    const skillSet = new Set(c.skills.map((s) => s.toLowerCase().trim()));
    const matched = req.filter((s) => skillSet.has(s));
    const missing = req.filter((s) => !skillSet.has(s));
    const skillMatchPct = req.length > 0 ? (matched.length / req.length) * 100 : 60;

    const availabilityScore = AVAILABILITY_SCORE[c.availability];
    const spareCapacity = clamp(100 - c.currentWorkload);
    const experienceScore = clamp(c.experienceYears * 8);
    const performanceScore = clamp(c.performanceScore);

    const fitScore = round(
      clamp(
        skillMatchPct * WEIGHTS.skill +
          availabilityScore * WEIGHTS.availability +
          spareCapacity * WEIGHTS.capacity +
          experienceScore * WEIGHTS.experience +
          performanceScore * WEIGHTS.performance
      )
    );

    return {
      id: c.id,
      name: c.name,
      designation: c.designation,
      fitScore,
      skillMatchPct: round(skillMatchPct),
      spareCapacity: round(spareCapacity),
      matchedSkills: matched,
      missingSkills: missing,
      breakdown: [
        { label: 'Skill match', value: round(skillMatchPct * WEIGHTS.skill) },
        { label: 'Availability', value: round(availabilityScore * WEIGHTS.availability) },
        { label: 'Spare capacity', value: round(spareCapacity * WEIGHTS.capacity) },
        { label: 'Experience', value: round(experienceScore * WEIGHTS.experience) },
        { label: 'Performance', value: round(performanceScore * WEIGHTS.performance) },
      ],
    };
  });

  return scored.sort((a, b) => b.fitScore - a.fitScore);
}
