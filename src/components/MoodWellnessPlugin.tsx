import React, { useState } from 'react';
import { AudioPlayerContainer } from './AudioPlayerContainer';
import { WellnessTrack } from '../services/audioArchiveService';

type WorkflowStep = 'current_mood' | 'intensity' | 'desired_state' | 'preferences' | 'duration' | 'playback';

export const MoodWellnessPlugin: React.FC = () => {
  // Wizard Configuration Workflow States
  const [step, setStep] = useState<WorkflowStep>('current_mood');
  const [currentMood, setCurrentMood] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(3);
  const [desiredState, setDesiredState] = useState<string>('');
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(15);

  // Core Runtime Communication Engine States
  const [playlistTracks, setPlaylistTracks] = useState<WellnessTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const togglePreference = (genre: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleGeneratePlaylist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/music-wellness/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMood,
          intensity,
          desiredMood: desiredState,
          musicPreferences: selectedPrefs,
          sessionDuration: duration
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server pipeline processing failure.');
      }

      const data = await response.json();
      setPlaylistTracks(data.tracks || []);
      setStep('playback');
    } catch (err: any) {
      setError(err.message || 'A network communication exception occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleTelemetrySubmit = (score: string) => {
    // Fire-and-forget lightweight post-session performance log event dispatch telemetry
    fetch('/api/v1/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'music_wellness_feedback',
        payload: { currentMood, intensity, desiredState, selectedPrefs, duration, score }
      })
    }).catch((err) => console.warn('[Telemetry Logging Blocked]:', err.message));

    handleRestartWorkflow();
  };

  const handleRestartWorkflow = () => {
    setCurrentMood('');
    setIntensity(3);
    setDesiredState('');
    setSelectedPrefs([]);
    setDuration(15);
    setPlaylistTracks([]);
    setError(null);
    setStep('current_mood');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 min-h-[420px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-3">
          <h2 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <span>🧘</span> Sound Mind Module
          </h2>
          {step !== 'playback' && (
            <span className="text-xs text-gray-400 font-medium">
              Step {['current_mood', 'intensity', 'desired_state', 'preferences', 'duration'].indexOf(step) + 1} of 5
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium mb-4 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold ml-2">×</button>
          </div>
        )}

        {/* STEP 1: CURRENT MOOD SELECTION */}
        {step === 'current_mood' && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">How is your emotional state right now?</label>
            <div className="grid grid-cols-1 gap-2">
              {['Anxious', 'Sad', 'Tired', 'Stressed', 'Distracted'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => { setCurrentMood(mood); setStep('intensity'); }}
                  className="w-full text-left p-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 active:scale-[0.99] transition-all"
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: INTENSITY SELECTOR */}
        {step === 'intensity' && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rate the intensity of this feeling:</label>
            <p className="text-xs text-gray-500 mb-6">Levels adjust search targeting from subtle shifts up to deep environmental relaxation.</p>
            
            <div className="flex justify-between items-center px-4 mb-8">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setIntensity(num)}
                  className={`w-11 h-11 rounded-full font-bold text-sm border flex items-center justify-center transition-all ${
                    intensity === num 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-110' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('current_mood')} className="w-1/3 py-2.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-xl">Back</button>
              <button onClick={() => setStep('desired_state')} className="w-2/3 py-2.5 bg-gray-800 text-white text-xs font-medium rounded-xl">Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3: DESIRED STATE SELECTION */}
        {step === 'desired_state' && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What is your targeted outcome state?</label>
            <div className="grid grid-cols-1 gap-2">
              {['Calm', 'Energized', 'Focused', 'Comforted', 'Sleepy'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => { setDesiredState(mood); setStep('preferences'); }}
                  className="w-full text-left p-3.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 hover:border-teal-200 active:scale-[0.99] transition-all"
                >
                  {mood}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('intensity')} className="w-full py-2.5 mt-4 border border-gray-200 text-gray-500 text-xs font-medium rounded-xl">Back</button>
          </div>
        )}

        {/* STEP 4: MUSIC PREFERENCES SELECTION */}
        {step === 'preferences' && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sound Profiling Preferences:</label>
            <p className="text-xs text-gray-500 mb-4">Select one or more to prioritize track matching.</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['Lo-fi', 'Piano', 'Ambient', 'Acoustic', 'Electronic'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => togglePreference(genre)}
                  className={`p-3 border text-xs font-semibold rounded-xl transition-all ${
                    selectedPrefs.includes(genre)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('desired_state')} className="w-1/3 py-2.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-xl">Back</button>
              <button 
                onClick={() => setStep('duration')} 
                disabled={selectedPrefs.length === 0}
                className="w-2/3 py-2.5 bg-gray-800 text-white text-xs font-medium rounded-xl disabled:opacity-40"
              >
                Set Session Length
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SESSION DURATION TIMING INPUT */}
        {step === 'duration' && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Set target session configuration timing length:</label>
            <div className="flex justify-around items-center mb-8">
              {[5, 15, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    duration === mins
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 font-bold scale-105'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-md">{mins}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-80">Mins</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('preferences')} className="w-1/3 py-2.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-xl" disabled={loading}>Back</button>
              <button
                onClick={handleGeneratePlaylist}
                disabled={loading}
                className="w-2/3 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 tracking-wide uppercase"
              >
                {loading ? 'Assembling Track Mix...' : 'Generate Playlist'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: PLAYBACK ENGINE WRAPPER SCREEN CONTAINER */}
        {step === 'playback' && (
          <AudioPlayerContainer
            tracks={playlistTracks}
            desiredState={desiredState}
            onSessionComplete={handleTelemetrySubmit}
            onRestart={handleRestartWorkflow}
          />
        )}
      </div>
    </div>
  );
};