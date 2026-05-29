import { MOOD_INTENSITY_MAP, getIntensityRange } from '../src/data/moodMappings';

describe('Step 1: Mood Mapping Structural Configuration Asserts', () => {
  it('should evaluate boundaries to confirm intensity buckets match properly', () => {
    expect(getIntensityRange(1)).toBe('low');
    expect(getIntensityRange(2)).toBe('low');
    expect(getIntensityRange(3)).toBe('high');
    expect(getIntensityRange(5)).toBe('high');
  });

  it('should enforce mapping values for high-intensity anxiety configurations', () => {
    const context = MOOD_INTENSITY_MAP['Anxious']['high'];
    expect(context.searchQuery).toBe('meditation ambient');
    expect(context.targetTags).toContain('healing');
  });
});