import { WellnessTrack } from '../services/audioArchiveService';

export interface ScoredTrack {
  track: WellnessTrack;
  score: number;
}

export class PlaylistBuilder {

  /**
   * Scores a track element based on matching criteria from verified metadata fields.
   * Runs at an O(M + N) evaluation threshold where M = targetTags and N = userPreferences.
   */
  public static scoreTrack(
    track: WellnessTrack,
    subjects: string[],
    targetTags: string[],
    userPreferences: string[]
  ): number {
    let finalScore = 0;
    
    const cleanTitle = track.title ? track.title.toLowerCase() : '';
    const cleanSubjects = subjects.map(s => s.toLowerCase().trim());

    // 1. Subject Tag Match Evaluation (+30 points per match)
    targetTags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().trim();
      if (cleanSubjects.includes(normalizedTag)) {
        finalScore += 30;
      }
    });

    // 2. Secondary Title Phrase Match Evaluation (+15 points per match)
    targetTags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().trim();
      if (cleanTitle.includes(normalizedTag)) {
        finalScore += 15;
      }
    });

    // 3. User Genre Preference Match Evaluation (+25 points per match)
    userPreferences.forEach(pref => {
      const normalizedPref = pref.toLowerCase().trim();
      if (cleanTitle.includes(normalizedPref) || cleanSubjects.includes(normalizedPref)) {
        finalScore += 25;
      }
    });

    return finalScore;
  }

  /**
   * Builds an optimized session playlist using a greedy selection strategy.
   * Prioritizes top-ranked content while matching target durations within tight bounds.
   */
  public static buildSessionPlaylist(
    rawItems: { doc: WellnessTrack; subjects: string[] }[],
    targetMinutes: number,
    targetTags: string[],
    userPreferences: string[]
  ): WellnessTrack[] {
    const targetSeconds = targetMinutes * 60;

    // 1. Map, score, and sort candidate tracks in descending order
    const scoredTracks: ScoredTrack[] = rawItems.map(item => ({
      track: item.doc,
      score: this.scoreTrack(item.doc, item.subjects, targetTags, userPreferences)
    }));

    scoredTracks.sort((a, b) => b.score - a.score);

    const finalizedPlaylist: WellnessTrack[] = [];
    let cumulativeDurationSeconds = 0;

    // Set upper and lower tolerance threshold bounds
    const upperLimitBoundary = targetSeconds + 180; // +3 minutes max variance allowed
    const lowerLimitBoundary = targetSeconds - 45;  // -45 seconds min variance allowed

    // 2. Greedy selection execution pass
    for (const item of scoredTracks) {
      // Deduplicate elements to avoid playing identical tracks back-to-back
      if (finalizedPlaylist.some(t => t.id === item.track.id)) continue;

      if (cumulativeDurationSeconds + item.track.duration <= upperLimitBoundary) {
        finalizedPlaylist.push(item.track);
        cumulativeDurationSeconds += item.track.duration;
      }

      // Break selection processing early if we fall within the acceptable target window range
      if (cumulativeDurationSeconds >= lowerLimitBoundary) {
        break;
      }
    }

    return finalizedPlaylist;
  }
}