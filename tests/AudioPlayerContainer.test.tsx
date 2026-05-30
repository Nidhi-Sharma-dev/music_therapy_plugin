import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioPlayerContainer } from '../src/components/AudioPlayerContainer';
import { WellnessTrack } from '../src/services/audioArchiveService';

const mockTracks: WellnessTrack[] = [
  { id: 'id_1', title: 'Test Ambient Tune', artist: 'Artist Test', duration: 120, audioUrl: 'test.mp3' }
];

describe(' AudioPlayerContainer DOM Interaction Assertions', () => {
  it('should render the audio metadata strings correctly', () => {
    render(
      <AudioPlayerContainer 
        tracks={mockTracks} 
        onSessionComplete={jest.fn()} 
        onRestart={jest.fn()} 
        desiredState="Calm" 
      />
    );
    expect(screen.getByText('Test Ambient Tune')).toBeInTheDocument();
    expect(screen.getByText('Artist Test')).toBeInTheDocument();
  });

  it('should switch into the feedback screen interface overlay layout when ending the session early', () => {
    render(
      <AudioPlayerContainer 
        tracks={mockTracks} 
        onSessionComplete={jest.fn()} 
        onRestart={jest.fn()} 
        desiredState="Calm" 
      />
    );
    const endButton = screen.getByText('End Session Early');
    fireEvent.click(endButton);
    expect(screen.getByText('Session Complete')).toBeInTheDocument();
  });
});