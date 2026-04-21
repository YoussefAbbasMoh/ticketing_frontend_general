import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onRecorded, recording, setRecording, disabled = false }) => {
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update duration timer
  useEffect(() => {
    if (recording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          // Auto-stop at 5 minutes
          if (prev >= 299) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recording, isPaused]);

  // Visualize audio level
  const visualizeAudio = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 256;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!recording) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 128) * 100));
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error('Error visualizing audio:', error);
    }
  };

  const startRecording = async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;

      // Check for supported audio formats
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          // Add duration to the blob
          audioBlob.duration = duration;
          onRecorded(audioBlob);
        }
        
        cleanupRecording();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      setDuration(0);
      setIsPaused(false);
      
      // Start audio visualization
      visualizeAudio(stream);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Could not access microphone. Please check your settings and try again.');
      }
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && recording) {
      if (cancel) {
        // Clear chunks if canceling
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
      setRecording(false);
      setIsPaused(false);
      setDuration(0);
      setAudioLevel(0);
    }
  };

  const cancelRecording = () => {
    stopRecording(true);
  };

  const cleanupRecording = () => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      {recording ? (
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 rounded-xl border border-red-200">
          {/* Audio Visualizer */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 sm:w-1 bg-red-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(3, Math.min(18, (audioLevel / 100) * 18 * (1 - i * 0.15)))}px`,
                }}
              />
            ))}
          </div>

          {/* Duration */}
          <span className="text-xs sm:text-sm font-medium text-red-600 min-w-[35px] sm:min-w-[40px]">
            {formatDuration(duration)}
          </span>

          {/* Max duration indicator */}
          {duration >= 240 && (
            <span className="text-xs text-red-500 hidden sm:inline">
              {300 - duration}s left
            </span>
          )}

          {/* Cancel Button */}
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1 sm:p-1.5 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
            title="Cancel recording"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Stop/Send Button */}
          <button
            type="button"
            onClick={() => stopRecording(false)}
            className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex-shrink-0"
            disabled={duration < 1}
            title="Send voice message"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="p-2 sm:p-2.5 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Record voice message"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;