/**
 * Deterministic match scoring — documented, reproducible, computed on the
 * server from the skill/requirement lists returned by the AI.
 *
 *   skillScore  = 100 × (2·matched + related) / (2·matched + related + 2·missing)
 *   reqScore    = 100 × demonstratedRequirements / totalRequirements
 *   finalScore  = round(0.7·skillScore + 0.3·reqScore)   when requirements exist
 *               = round(skillScore)                       otherwise
 *
 * The result is clamped to 0–100. The AI never supplies the number itself.
 */
export function computeMatchScore(result) {
  const matched = count(result.matchedSkills);
  const missing = count(result.missingSkills);
  const related = count(result.relatedSkills);

  const weight = 2 * matched + related;
  const total = weight + 2 * missing;
  const skillScore = total === 0 ? 0 : (100 * weight) / total;

  const requirements = Array.isArray(result.requirements) ? result.requirements : [];
  if (requirements.length === 0) {
    return clamp(Math.round(skillScore));
  }
  const demonstrated = requirements.filter((r) => r && r.demonstrated === true).length;
  const reqScore = (100 * demonstrated) / requirements.length;
  return clamp(Math.round(0.7 * skillScore + 0.3 * reqScore));
}

const count = (v) => (Array.isArray(v) ? v.length : 0);
const clamp = (n) => Math.max(0, Math.min(100, n));
