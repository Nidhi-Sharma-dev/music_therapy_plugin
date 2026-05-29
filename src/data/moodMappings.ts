/**
 * Core Domain Interfaces for the Intensity-Aware Mapping Matrix
 */
export interface IntensityMapping {
  searchQuery: string;
  targetTags: string[];
}

export type IntensityRange = 'low' | 'high';

export interface MoodConfig {
  low: IntensityMapping;  // Intensity levels 1-2
  high: IntensityMapping; // Intensity levels 3-5
}

/**
 * Strict, intensity-aware data matrix that translates a user's emotional state 
 * into targeted search queries and validation tags for the Internet Archive API.
 */
export const MOOD_INTENSITY_MAP: Record<string, MoodConfig> = {
  Anxious: {
    low: {
      searchQuery: 'acoustic relax',
      targetTags: ['peaceful', 'soft', 'calm', 'guitar']
    },
    high: {
      searchQuery: 'meditation ambient',
      targetTags: ['deep-ambient', 'healing', 'drone', 'solfeggio']
    }
  },
  Sad: {
    low: {
      searchQuery: 'hopeful piano',
      targetTags: ['gentle', 'warm', 'light', 'melodic']
    },
    high: {
      searchQuery: 'cinematic ambient',
      targetTags: ['emotional', 'melancholy', 'comforting', 'slow']
    }
  },
  Tired: {
    low: {
      searchQuery: 'lofi chillhop',
      targetTags: ['groove', 'mid-tempo', 'smooth', 'steady']
    },
    high: {
      searchQuery: 'upbeat electronic',
      targetTags: ['synthwave', 'motivational', 'dance', 'house']
    }
  },
  Stressed: {
    low: {
      searchQuery: 'ambient drone',
      targetTags: ['minimal', 'focus', 'study', 'binaural']
    },
    high: {
      searchQuery: 'classical piano',
      targetTags: ['baroque', 'concentration', 'deep-work']
    }
  },
  Distracted: {
    low: {
      searchQuery: 'alpha waves studying',
      targetTags: ['binaural', 'white-noise', 'focus']
    },
    high: {
      searchQuery: 'alpha waves studying',
      targetTags: ['binaural', 'white-noise', 'focus']
    }
  }
};

/**
 * Helper utility to classify a numeric intensity score (1-5) into a discrete range category.
 * @param intensity Numeric score from 1 to 5
 */
export function getIntensityRange(intensity: number): IntensityRange {
  return intensity <= 2 ? 'low' : 'high';
}