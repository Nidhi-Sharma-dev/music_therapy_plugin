import { AudioArchiveService } from '../src/services/audioArchiveService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Step 2: Internet Archive Client Normalization Engine Asserts', () => {
  let service: AudioArchiveService;

  beforeEach(() => {
    service = new AudioArchiveService();
    jest.clearAllMocks();
  });

  it('should parse timestamp strings and float strings into total seconds', () => {
    expect(service.parseLengthToSeconds('04:15')).toBe(255);
    expect(service.parseLengthToSeconds('242.00')).toBe(242);
    expect(service.parseLengthToSeconds('')).toBe(180); // Fallback standard
  });

  it('should ignore item buckets that lack a valid MP3 file asset', async () => {
    // Mock the advanced search query output layout
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        response: {
          docs: [{ identifier: 'empty_bucket_2026', title: 'Empty Track Listing' }]
        }
      }
    });

    // Mock the individual files metadata check to return zero .mp3 configurations
    mockedAxios.get.mockResolvedValueOnce({
      data: { result: [{ name: 'album_art.jpg', format: 'JPEG' }] }
    });

    const tracks = await service.fetchWellnessTracks('ambient');
    expect(tracks).toHaveLength(0); // The candidate track is ignored cleanly
  });
});