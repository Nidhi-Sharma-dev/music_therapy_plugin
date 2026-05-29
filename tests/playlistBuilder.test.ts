import { PlaylistBuilder } from '../src/utils/playlistBuilder';
import { WellnessTrack } from '../src/services/audioArchiveService';

describe('Step 3: Playlist Builder Logic & Grading Tests', () => {
  const mockItem: WellnessTrack = {
    id: 'archive_track_01',
    title: 'Deep Ambient Meditation Bliss',
    artist: 'Wellness Producer',
    duration: 300,
    audioUrl: 'https://archive.org/download/track01.mp3'
  };

  it('should successfully calculate track scores using subject terms and user preferences', () => {
    const computedScore = PlaylistBuilder.scoreTrack(
      mockItem,
      ['meditation', 'calm'],             // Mock metadata subjects array
      ['meditation', 'ambient'],          // Targeted matrix tags
      ['Ambient']                         // User selected genre preferences
    );

    // Subject match for 'meditation' (+30)
    // Title match for 'meditation' (+15) and 'ambient' (+15)
    // Preference bonus match for 'Ambient' via title (+25)
    // Expected Total: 30 + 15 + 15 + 25 = 85 points
    expect(computedScore).toBe(85);
  });

  it('should assemble a correct 5-minute playlist composition when given an array of tracks', () => {
    const rawMockPool = [
      { doc: mockItem, subjects: ['meditation'] },
      { doc: { ...mockItem, id: 'track_02', duration: 180, title: 'Short Clip' }, subjects: ['relax'] }
    ];

    const playlist = PlaylistBuilder.buildSessionPlaylist(rawMockPool, 5, ['meditation'], ['Ambient']);
    expect(playlist).toHaveLength(1);
    expect(playlist[0].id).toBe('archive_track_01'); // Selects the highest-scoring track that fits
  });
});