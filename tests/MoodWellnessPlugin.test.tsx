import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MoodWellnessPlugin } from '../src/components/MoodWellnessPlugin';

describe('Step 6: MoodWellnessPlugin Form Wizard Core Assertions', () => {
  it('should display the current mood choice buttons upon initial load', () => {
    render(<MoodWellnessPlugin />);
    expect(screen.getByText('Anxious')).toBeInTheDocument();
    expect(screen.getByText('Stressed')).toBeInTheDocument();
  });

  it('should transition to the intensity slider input page upon clicking a current state selection', () => {
    render(<MoodWellnessPlugin />);
    const anxiousButton = screen.getByText('Anxious');
    fireEvent.click(anxiousButton);
    expect(screen.getByText('Rate the intensity of this feeling:')).toBeInTheDocument();
  });
});