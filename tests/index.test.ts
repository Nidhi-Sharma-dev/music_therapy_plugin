/// <reference types="jest" />
import express from 'express';
import request from 'supertest';
import { wellnessPluginRouter } from '../src/index';

const app = express();
app.use(express.json());
app.use('/api/music-wellness', wellnessPluginRouter);

describe('Step 4: Express Plugin Router HTTP Processing Pipelines', () => {
  it('should return a 400 validation error if intensity values are out of bounds', async () => {
    const response = await request(app)
      .post('/api/music-wellness/generate')
      .send({
        currentMood: 'Anxious',
        intensity: 42, // Intentional validation breach
        desiredMood: 'Calm',
        musicPreferences: ['Piano'],
        sessionDuration: 15
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ValidationError');
  });
});