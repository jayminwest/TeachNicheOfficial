import { render, screen, waitFor } from '@testing-library/react';
import { VideoPlayer } from '../video-player';
import { LessonAccessGate } from '../lesson-access-gate';
import MuxPlayer from '@mux/mux-player-react';

// Mock the dependencies
jest.mock('@mux/mux-player-react', () => {
  return jest.fn().mockImplementation(({ playbackId, metadata, streamType, tokens }) => {
    return (
      <div data-testid="mux-player" data-playback-id={playbackId}>
        <div data-testid="metadata">{JSON.stringify(metadata)}</div>
        <div data-testid="stream-type">{streamType}</div>
        <div data-testid="tokens">{JSON.stringify(tokens)}</div>
        <button data-testid="play-button">Play</button>
        <button data-testid="pause-button">Pause</button>
        <button data-testid="fullscreen-button">Fullscreen</button>
        <input data-testid="volume-slider" type="range" min="0" max="100" />
        <select data-testid="quality-selector">
          <option value="auto">Auto</option>
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
        </select>
      </div>
    );
  });
});

jest.mock('../lesson-access-gate', () => ({
  LessonAccessGate: jest.fn(({ children, lessonId, price, className }) => (
    <div data-testid="lesson-access-gate" data-lesson-id={lessonId} data-price={price} className={className}>
      {children}
    </div>
  ))
}));

// Mock fetch for JWT token
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ token: 'mock-jwt-token' }),
  })
) as jest.Mock;

describe('VideoPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Component Rendering Tests
  describe('Rendering', () => {
    it('renders with playback ID and title', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
          price={9.99} 
        />
      );
      
      expect(screen.getByTestId('lesson-access-gate')).toBeInTheDocument();
      expect(screen.getByTestId('mux-player')).toBeInTheDocument();
      expect(screen.getByTestId('mux-player')).toHaveAttribute('data-playback-id', 'mock-playback-id');
    });

    it('applies custom className when provided', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
          className="custom-class" 
        />
      );
      
      expect(screen.getByTestId('lesson-access-gate')).toHaveClass('custom-class');
      expect(screen.getByTestId('lesson-access-gate')).toHaveClass('aspect-video');
      expect(screen.getByTestId('lesson-access-gate')).toHaveClass('rounded-lg');
      expect(screen.getByTestId('lesson-access-gate')).toHaveClass('overflow-hidden');
    });

    it('passes correct metadata to MuxPlayer', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      const metadataElement = screen.getByTestId('metadata');
      const metadata = JSON.parse(metadataElement.textContent || '{}');
      
      expect(metadata.video_id).toBe('video-123');
      expect(metadata.video_title).toBe('Test Video');
    });

    it('sets streamType to on-demand', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      expect(screen.getByTestId('stream-type').textContent).toBe('on-demand');
    });
  });

  // JWT Token Tests
  describe('JWT Token Handling', () => {
    it('fetches JWT token for protected content', async () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
          isFree={false} 
        />
      );
      
      expect(global.fetch).toHaveBeenCalledWith('/api/video/sign-playback', {
        method: 'POST',
        body: JSON.stringify({ playbackId: 'mock-playback-id' })
      });
      
      await waitFor(() => {
        const tokensElement = screen.getByTestId('tokens');
        const tokens = JSON.parse(tokensElement.textContent || '{}');
        expect(tokens.playback).toBe('mock-jwt-token');
      });
    });

    it('does not fetch JWT token for free content', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
          isFree={true} 
        />
      );
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // The component should not crash, and the token should remain undefined
      expect(screen.getByTestId('mux-player')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });

  // LessonAccessGate Integration Tests
  describe('LessonAccessGate Integration', () => {
    it('passes correct lessonId and price to LessonAccessGate', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
          price={19.99} 
        />
      );
      
      expect(screen.getByTestId('lesson-access-gate')).toHaveAttribute('data-lesson-id', 'video-123');
      expect(screen.getByTestId('lesson-access-gate')).toHaveAttribute('data-price', '19.99');
    });

    it('wraps MuxPlayer with LessonAccessGate', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      const accessGate = screen.getByTestId('lesson-access-gate');
      const muxPlayer = screen.getByTestId('mux-player');
      
      expect(accessGate).toContainElement(muxPlayer);
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('provides accessible controls via MuxPlayer', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      expect(screen.getByTestId('fullscreen-button')).toBeInTheDocument();
      expect(screen.getByTestId('volume-slider')).toBeInTheDocument();
      expect(screen.getByTestId('quality-selector')).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('handles undefined id gracefully', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
        />
      );
      
      expect(screen.getByTestId('lesson-access-gate')).toHaveAttribute('data-lesson-id', 'undefined');
      
      const metadataElement = screen.getByTestId('metadata');
      const metadata = JSON.parse(metadataElement.textContent || '{}');
      
      expect(metadata.video_id).toBeUndefined();
    });

    it('handles undefined price gracefully', () => {
      render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      expect(screen.getByTestId('lesson-access-gate')).toHaveAttribute('data-price', 'undefined');
    });
  });

  // Effect Cleanup
  describe('Effect Cleanup', () => {
    it('cleans up effect on unmount', async () => {
      const { unmount } = render(
        <VideoPlayer 
          playbackId="mock-playback-id" 
          title="Test Video" 
          id="video-123" 
        />
      );
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      // Unmount should not cause any errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
