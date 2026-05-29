import React, { useState, useRef, useEffect } from 'react';
import { WellnessTrack } from '../services/audioArchiveService';

interface AudioPlayerContainerProps {
  tracks: WellnessTrack[];
  onSessionComplete: (score: string) => void;
  onRestart: () => void;
  desiredState: string;
}

export const AudioPlayerContainer: React.FC<AudioPlayerContainerProps> = ({
  tracks,
  onSessionComplete,
  onRestart,
  desiredState
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentIndex];

  // Synchronize playback operations whenever index pointer updates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn('[AudioPlayerContainer] Media playback auto-start block context:', err.message);
          setIsPlaying(false);
        });
      }
    }
  }, [currentIndex]);

  const togglePlayPause = () => {
    if (!audioRef.current || tracks.length === 0) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('[AudioPlayerContainer] Media manual activation failure:', err));
    }
  };

  const handleNextTrack = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setShowFeedback(true); // Terminal playlist node reached; trigger feedback capture overlay view
    }
  };

  const handlePrevTrack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 mb-4">No streamable audio targets could be aligned for this combination.</p>
        <button onClick={onRestart} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
          Modify Selections
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-gray-900 text-white rounded-2xl p-6 shadow-xl border border-gray-800 transition-all">
      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onEnded={handleNextTrack}
        preload="auto"
      />

      {!showFeedback ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-semibold bg-gray-800 text-indigo-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Transitioning to {desiredState}
            </span>
            <span className="text-xs text-gray-400">
              {currentIndex + 1} / {tracks.length}
            </span>
          </div>

          <div className="text-center mb-8 h-20 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-gray-100 truncate px-2">{currentTrack?.title}</h3>
            <p className="text-xs text-gray-400 truncate px-4 mt-1.5">{currentTrack?.artist}</p>
          </div>

          {/* Media Interactive Interface Controller Group Wrapper */}
          <div className="flex items-center justify-center space-x-8 mb-6">
            <button 
              onClick={handlePrevTrack} 
              disabled={currentIndex === 0}
              className="text-2xl text-gray-400 hover:text-white disabled:opacity-20 transition-opacity p-2 focus:outline-none"
              aria-label="Previous Track"
            >
              ⏮
            </button>

            <button 
              onClick={togglePlayPause}
              className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-2xl text-white shadow-lg hover:brightness-110 active:scale-95 transition-all focus:outline-none"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button 
              onClick={handleNextTrack}
              className="text-2xl text-gray-400 hover:text-white transition-opacity p-2 focus:outline-none"
              aria-label="Next Track"
            >
              ⏭
            </button>
          </div>

          <div className="border-t border-gray-800 pt-4 flex justify-center">
            <button onClick={() => setShowFeedback(true)} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">
              End Session Early
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400 text-xl">
            ✨
          </div>
          <h3 className="text-md font-bold text-gray-100 mb-2">Session Complete</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
            Did this custom audio compilation support your transition toward a state of {desiredState}?
          </p>
          
          <div className="space-y-2">
            {['Helpful', 'Somewhat Helpful', 'Not Helpful'].map((score) => (
              <button
                key={score}
                onClick={() => onSessionComplete(score)}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-700 text-gray-200 text-xs font-medium rounded-xl border border-gray-700/50 transition-colors focus:outline-none"
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};