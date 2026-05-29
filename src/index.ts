import express, { Request, Response, Router } from 'express';
import { MOOD_INTENSITY_MAP, getIntensityRange } from './data/moodMappings';
import { AudioArchiveService } from './services/audioArchiveService';
import { PlaylistBuilder } from './utils/playlistBuilder';

// Instantiate core domain services in process memory space
const audioArchiveService = new AudioArchiveService();
const wellnessPluginRouter = Router();

/**
 * Interface type guard for strict validation of incoming request payloads
 */
export interface GeneratePlaylistRequest {
  currentMood: string;
  intensity: number;
  desiredMood: string;
  musicPreferences: string[];
  sessionDuration: number; // Duration target in minutes
}

/**
 * POST /api/music-wellness/generate
 * Processes user parameters dynamically without touching a local database layer.
 */
wellnessPluginRouter.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      currentMood, 
      intensity, 
      desiredMood, 
      musicPreferences, 
      sessionDuration 
    } = req.body as GeneratePlaylistRequest;

    // 1. Primitive Type Data Guardrail Validation
    if (!currentMood || !desiredMood || !Array.isArray(musicPreferences) || !sessionDuration) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Missing or malformed mandatory parameters.'
      });
      return;
    }

    if (typeof intensity !== 'number' || intensity < 1 || intensity > 5) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Intensity level metric parameter must be an integer scale value between 1 and 5.'
      });
      return;
    }

    // 2. Fetch Intensity-Aware Tag Matrix Strategy Configuration
    const moodConfig = MOOD_INTENSITY_MAP[currentMood];
    if (!moodConfig) {
      res.status(400).json({
        error: 'ValidationError',
        message: `Current mood selection configuration "${currentMood}" is unsupported by the mapping system.`
      });
      return;
    }

    const intensityRange = getIntensityRange(intensity);
    const targetMapping = moodConfig[intensityRange];

    // 3. Execution Layer: Query Internet Archive via Search Client API Gateway
    const primaryCandidatePool = await audioArchiveService.fetchWellnessTracks(targetMapping.searchQuery);
    let finalCandidatesList = [...primaryCandidatePool];

    // 4. Filter Relaxation Fallback Policy: If results are too thin, execute an expanded search
    if (finalCandidatesList.length < 5) {
      const relaxedTermFallback = 'instrumental music';
      const secondaryFallbackPool = await audioArchiveService.fetchWellnessTracks(relaxedTermFallback);
      finalCandidatesList = [...finalCandidatesList, ...secondaryFallbackPool];
    }

    // 5. Normalization Transformation Formatting Pass
    const structuredItems = finalCandidatesList.map(track => ({
      doc: track,
      subjects: [targetMapping.searchQuery, ...targetMapping.targetTags]
    }));

    // 6. Execute Dynamic Scoring Optimization and Playlist Assembly Heuristics
    const finalizedPlaylistTracks = PlaylistBuilder.buildSessionPlaylist(
      structuredItems,
      sessionDuration,
      targetMapping.targetTags,
      musicPreferences
    );

    // Calculate aggregated actual duration metrics for data evaluation tracking
    const totalDurationSeconds = finalizedPlaylistTracks.reduce((acc, t) => acc + t.duration, 0);

    // 7. Egress Return Mapping Schema Object
    res.status(200).json({
      targetDurationMinutes: sessionDuration,
      actualDurationSeconds: totalDurationSeconds,
      tracks: finalizedPlaylistTracks
    });

  } catch (error: any) {
    console.error('[Wellness Routing Controller Exception]:', error.message);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'An execution anomaly occurred while orchestrating your playlist request.'
    });
  }
});

export { wellnessPluginRouter };

// ============================================================================
// SANDBOX HOST ENGINE BOOTSTRAPPER LAYER
// ============================================================================
const app = express();
app.use(express.json());

// Mount our functional plugin router onto the target sandbox pipeline route path
app.use('/api/music-wellness', wellnessPluginRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 [Music Wellness Sandbox Engine Live]`);
  console.log(`📡 Listening for incoming requests on: http://localhost:${PORT}`);
  console.log(`📝 Ready to process cURL simulation payloads.\n`);
});