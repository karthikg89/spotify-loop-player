import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import './App.css';

const spotifyApi = new SpotifyWebApi();

function App() {
  const [token, setToken] = useState(null);
  const [player, setPlayer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(null); // 'start', 'end', or null
  const [playerState, setPlayerState] = useState(null);

  useEffect(() => {
    // Get token from URL params (after Spotify auth redirect)
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce((initial, item) => {
        let parts = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
        return initial;
      }, {});

    if (hash.access_token) {
      setToken(hash.access_token);
      spotifyApi.setAccessToken(hash.access_token);
    }
  }, []);

  useEffect(() => {
    if (!token) return; // Only proceed if we have a token
    
    // Check if script is already loaded
    if (!document.getElementById('spotify-player')) {
      const script = document.createElement("script");
      script.id = 'spotify-player'; // Add an ID to check for existence
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Loop Player',
          getOAuthToken: cb => { cb(token); }
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          // Transfer playback to our player
          spotifyApi.transferMyPlayback([device_id]);
        });

        player.connect();
        setPlayer(player);
      };
    }
  }, [token]);

  // Update the track state listener useEffect
  useEffect(() => {
    if (player) {
      player.addListener('player_state_changed', (state) => {
        if (state) {
          setPlayerState(state);
          setCurrentTrack({
            name: state.track_window.current_track.name,
            artist: state.track_window.current_track.artists[0].name,
            duration: state.duration,
            uri: state.track_window.current_track.uri
          });
          setDuration(state.duration);
        }
      });
    }
  }, [player, currentTrack]);

  // Update the loop checking useEffect
  useEffect(() => {
    if (player) {
      const timeInterval = setInterval(async () => {
        const state = await player.getCurrentState();
        if (state) {
          setCurrentTime(state.position);
          
          // Only seek to start position if looping is enabled and we're past the end
          if (isLooping && state.position >= loopEnd && !isDragging) {
            player.seek(loopStart).catch(err => console.error('Seek error:', err));
          }
        }
      }, 100);

      return () => clearInterval(timeInterval);
    }
  }, [player, isLooping, loopStart, loopEnd, isDragging]);

  // Update the keyboard event listener useEffect
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleNextTrack();
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePreviousTrack();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [player]);

  const handleLogin = () => {
    const CLIENT_ID = '90578a866be642ed97064a098d97fecd';
    // Update this to match your GitHub Pages URL
    const REDIRECT_URI = 'https://yourusername.github.io/repository-name/';
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming'
    ];

    window.location.href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}&response_type=token`;
  };

  // Add playback controls
  const handlePlayPause = async () => {
    if (!player) return;
    const state = await player.getCurrentState();
    if (state?.paused) {
      await player.resume();
    } else {
      await player.pause();
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const clickTime = clickPosition * duration;
    
    // Check if click is near either loop marker (within 2px)
    const startPosition = (loopStart / duration);
    const endPosition = (loopEnd / duration);
    const tolerance = 2 / rect.width; // Convert 2px to percentage
    
    // Only block seeking if we're near the end marker
    if (Math.abs(clickPosition - endPosition) < tolerance) {
      return; // Don't seek if clicking near end marker
    }
    
    player.seek(clickTime);
  };

  const handleLoopPointMouseDown = (e, point) => {
    setIsDragging(point);
    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const timeline = document.querySelector('.timeline');
    const rect = timeline.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const timePosition = position * duration;
    
    if (isDragging === 'start') {
      setLoopStart(Math.min(timePosition, loopEnd));
    } else if (isDragging === 'end') {
      setLoopEnd(Math.max(timePosition, loopStart));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add this useEffect to handle mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, duration, loopStart, loopEnd]);

  // Add these functions after handlePlayPause
  const handleNextTrack = async () => {
    if (!player) return;
    setIsLooping(false);  // Turn off looping
    await player.nextTrack();
  };

  const handlePreviousTrack = async () => {
    if (!player) return;
    setIsLooping(false);  // Turn off looping
    await player.previousTrack();
  };

  return (
    <div className="App">
      {!token ? (
        <button onClick={handleLogin}>Login with Spotify</button>
      ) : (
        <div className="player-container">
          {currentTrack && (
            <div className="track-info">
              <h2>{currentTrack.name}</h2>
              <h3>{currentTrack.artist}</h3>
            </div>
          )}

          <div className="timeline-container">
            {/* Move current time and duration above the timeline */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '5px'
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div 
              className="timeline" 
              onClick={handleTimelineClick}
              style={{ 
                position: 'relative', 
                height: '40px', 
                background: '#ddd', 
                cursor: 'pointer',
                borderRadius: '20px',
                margin: '0 0 10px 0'  // Adjusted margin
              }}
            >
              {/* Playback progress */}
              <div 
                className="progress"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${(currentTime / duration) * 100}%`,
                  background: '#1db954',
                  borderRadius: '20px'
                }}
              />
              
              {/* Loop region */}
              <div 
                className="loop-region"
                style={{
                  position: 'absolute',
                  left: `${(loopStart / duration) * 100}%`,
                  width: `${((loopEnd - loopStart) / duration) * 100}%`,
                  height: '100%',
                  background: 'rgba(29, 185, 84, 0.3)',
                  borderRadius: '20px'
                }}
              />

              {/* Loop markers */}
              <div 
                className="loop-start"
                style={{
                  position: 'absolute',
                  left: `${(loopStart / duration) * 100}%`,
                  height: '60px',
                  top: '-10px',
                  width: '4px',
                  background: '#ffffff',
                  border: '2px solid #1db954',
                  cursor: 'ew-resize',
                  zIndex: 2,
                  borderRadius: '2px'
                }}
                onMouseDown={(e) => handleLoopPointMouseDown(e, 'start')}
              />
              <div 
                className="loop-end"
                style={{
                  position: 'absolute',
                  left: `${(loopEnd / duration) * 100}%`,
                  height: '60px',
                  top: '-10px',
                  width: '4px',
                  background: '#ffffff',
                  border: '2px solid #1db954',
                  cursor: 'ew-resize',
                  zIndex: 2,
                  borderRadius: '2px'
                }}
                onMouseDown={(e) => handleLoopPointMouseDown(e, 'end')}
              />
            </div>

            {/* Loop timestamps only */}
            <div className="time-display" style={{ 
              position: 'relative',
              height: '20px',  // Fixed height for loop timestamps
              marginTop: '15px'
            }}>
              {Math.abs((loopEnd - loopStart) / duration) > 0.1 ? (
                <>
                  <div style={{ 
                    position: 'absolute', 
                    left: `${(loopStart / duration) * 100}%`,
                    transform: 'translateX(-50%)',
                    color: '#1db954',
                    fontWeight: 'bold'
                  }}>
                    {formatTime(loopStart)}
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    left: `${(loopEnd / duration) * 100}%`,
                    transform: 'translateX(-50%)',
                    color: '#1db954',
                    fontWeight: 'bold'
                  }}>
                    {formatTime(loopEnd)}
                  </div>
                </>
              ) : (
                <div style={{ 
                  position: 'absolute', 
                  left: `${((loopStart + loopEnd) / 2 / duration) * 100}%`,
                  transform: 'translateX(-50%)',
                  color: '#1db954',
                  fontWeight: 'bold'
                }}>
                  {formatTime(loopStart)} - {formatTime(loopEnd)}
                </div>
              )}
            </div>
          </div>

          <div className="controls" style={{ 
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            alignItems: 'center'
          }}>
            <button 
              onClick={handlePreviousTrack}
              className="control-button"
              aria-label="Previous track"
              title="Previous Track"
            >
              ⏮
            </button>
            
            <button 
              onClick={handlePlayPause} 
              className="control-button"
              aria-label="Play or pause"
              title={playerState?.paused ? "Play" : "Pause"}
            >
              {playerState?.paused ? "▶" : "⏸"}
            </button>
            
            <button 
              onClick={handleNextTrack}
              className="control-button"
              aria-label="Next track"
              title="Next Track"
            >
              ⏭
            </button>

            <button 
              onClick={() => setIsLooping(!isLooping)}
              className={`control-button ${isLooping ? 'active' : ''}`}
              aria-label="Toggle loop"
              title={isLooping ? "Stop Loop" : "Start Loop"}
            >
              🔁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 