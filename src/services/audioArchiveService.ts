import axios from 'axios';

/**
 * Standardized internal interface for track assets.
 * Decouples downstream code from third-party schema shifts.
 */
export interface WellnessTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // Duration normalized to total seconds (integer)
  audioUrl: string; // Verified direct stream link
}

interface CacheEntry {
  tracks: WellnessTrack[];
  cachedAt: number;
}

export class AudioArchiveService {
  private readonly searchUrl = 'https://archive.org/advancedsearch.php';
  
  // Local cache map running inside the active process to stay under the 60 req/min rate limit
  private static cache = new Map<string, CacheEntry>();
  private readonly cacheDurationMs = 1000 * 60 * 60 * 2; // 2 Hours TTL

  /**
   * Normalizes variable length values (timestamps or float strings) into total seconds.
   * @param lengthStr Raw string value from the length metadata attribute
   */
  public parseLengthToSeconds(lengthStr: string): number {
    if (!lengthStr) return 180; // Default fallback to 3 minutes

    // Case 1: Value is a raw decimal float string (e.g., "242.00")
    if (lengthStr.includes('.') && !lengthStr.includes(':')) {
      const parsedFloat = Math.floor(parseFloat(lengthStr));
      return isNaN(parsedFloat) || parsedFloat <= 0 ? 180 : parsedFloat;
    }

    // Case 2: Value is a standard timestamp string (e.g., "MM:SS" or "HH:MM:SS")
    const parts = lengthStr.split(':').map(Number);
    if (parts.some(isNaN)) return 180;

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 180;
  }

  /**
   * Performs a secondary lookup to locate a valid MP3 asset within an item bucket.
   * Returns a direct streaming URL if found, or null if the item lacks an MP3 file.
   */
  private async locateValidAudioUrl(identifier: string): Promise<string | null> {
    try {
      const manifestUrl = `https://archive.org/metadata/${identifier}/files`;
      const response = await axios.get(manifestUrl, { timeout: 3000 });

      if (!response.data || !Array.isArray(response.data.result)) {
        return null;
      }

      // Locate an asset element ending with the .mp3 extension
      const audioFile = response.data.result.find(
        (file: any) => file.name && file.name.toLowerCase().endsWith('.mp3')
      );

      if (!audioFile) return null;

      // Build the verified direct streaming URL using the exact filename
      return `https://archive.org/download/${identifier}/${encodeURIComponent(audioFile.name)}`;
    } catch {
      return null; // Return null if the network check fails or times out
    }
  }

  /**
   * Fetches public audio items from the Archive API using subject tags.
   * @param subjectTag Target search keyword (e.g., 'ambient', 'lofi', 'classical')
   */
  public async fetchWellnessTracks(subjectTag: string): Promise<WellnessTrack[]> {
    const cleanTag = subjectTag.trim().toLowerCase();
    const now = Date.now();

    // 1. Check local process memory map cache
    const cachedResponse = AudioArchiveService.cache.get(cleanTag);
    if (cachedResponse && (now - cachedResponse.cachedAt < this.cacheDurationMs)) {
      return cachedResponse.tracks;
    }

    try {
      // 2. Query the Advanced Search endpoint
      const response = await axios.get(this.searchUrl, {
        params: {
          q: `subject:(${cleanTag}) AND mediatype:(audio)`,
          'fl[]': ['identifier', 'title', 'creator', 'length'],
          'sort[]': 'downloads desc',
          rows: 15, // Capped result window size to limit secondary API checks
          output: 'json'
        },
        timeout: 7000 // Defensive 7-second network timeout limit
      });

      if (!response.data || !response.data.response || !Array.isArray(response.data.response.docs)) {
        throw new Error('Malformed JSON structure returned from the Internet Archive API.');
      }

      const docsList = response.data.response.docs;
      const verifiedTracks: WellnessTrack[] = [];

      // 3. Map the raw API fields and confirm file availability via sequential checks
      for (const doc of docsList) {
        if (!doc.identifier || !doc.title) continue;
        const idStr = String(doc.identifier).trim();

        // Perform the secondary lookup to verify the file path exists
        const streamingUrl = await this.locateValidAudioUrl(idStr);
        if (!streamingUrl) continue; // Skip items that don't have a valid MP3 file

        let artistName = 'Independent Creator';
        if (doc.creator) {
          artistName = Array.isArray(doc.creator) ? String(doc.creator[0]) : String(doc.creator);
        }

        verifiedTracks.push({
          id: idStr,
          title: String(doc.title).trim(),
          artist: artistName.trim(),
          duration: this.parseLengthToSeconds(String(doc.length || '')),
          audioUrl: streamingUrl
        });
      }

      // 4. Update the local process cache
      AudioArchiveService.cache.set(cleanTag, {
        tracks: verifiedTracks,
        cachedAt: now
      });

      return verifiedTracks;

    } catch (error: any) {
      console.error(`[AudioArchiveService Exception]: Fetch failed for keyword "${subjectTag}":`, error.message);
      return []; // Return an empty array to gracefully handle failures without crashing
    }
  }
}