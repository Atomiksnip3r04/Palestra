// Media Session Manager for Lockscreen Controls
// Provides lockscreen timer display and controls for Focus Mode

export class MediaSessionManager {
    constructor() {
        this.isActive = false;
        this.currentWorkoutName = 'Allenamento';
        this.currentExercise = '';
        this.currentSet = 1;
        this.totalSets = 3;
        this.timerValue = 0;
        this.timerInterval = null;
        this.audioElement = null;
    }

    // Initialize Media Session
    init() {
        if ('mediaSession' in navigator) {
            console.log('Media Session API available');
            this.createSilentAudio();

            // Set default metadata
            this.updateMetadata({
                title: 'IRONFLOW',
                artist: 'Focus Mode',
                album: 'Allenamento'
            });

            // Set up action handlers
            this.setupActionHandlers();
        } else {
            console.warn('Media Session API not supported on this browser');
        }
    }

    createSilentAudio() {
        // Create a silent audio element to keep the session alive
        this.audioElement = document.createElement('audio');
        this.audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAGZGF0YQQAAAAAAA=='; // Silent wav
        this.audioElement.loop = true;
        document.body.appendChild(this.audioElement);
    }

    // Update metadata with current workout info
    updateMetadata({ title, artist, album, artwork }) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || this.currentExercise || 'Allenamento',
                artist: artist || `Set ${this.currentSet}/${this.totalSets}`,
                album: album || this.currentWorkoutName,
                artwork: artwork || [
                    {
                        src: 'assets/icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            });
        }
    }

    // Set up action handlers for media controls
    setupActionHandlers() {
        if ('mediaSession' in navigator) {
            // Play/Pause for timer control
            navigator.mediaSession.setActionHandler('play', () => {
                this.onPlayPause?.(true);
                if (this.audioElement) this.audioElement.play();
                navigator.mediaSession.playbackState = 'playing';
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                this.onPlayPause?.(false);
                if (this.audioElement) this.audioElement.pause();
                navigator.mediaSession.playbackState = 'paused';
            });

            // Next/Previous for exercise navigation
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                this.onPrevious?.();
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => {
                this.onNext?.();
            });

            // Set playback state
            navigator.mediaSession.playbackState = 'paused';
        }
    }

    // Start workout session
    startWorkout(workoutName) {
        this.isActive = true;
        this.currentWorkoutName = workoutName;
        this.updateMetadata({
            album: workoutName
        });

        // Play silent audio to activate session (must be triggered by user interaction)
        if (this.audioElement) {
            this.audioElement.play().catch(e => console.log('Audio play failed (interaction needed):', e));
        }

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    }

    // Update current exercise
    updateExercise(exerciseName, currentSet, totalSets) {
        this.currentExercise = exerciseName;
        this.currentSet = currentSet;
        this.totalSets = totalSets;

        this.updateMetadata({
            title: exerciseName,
            artist: `Set ${currentSet}/${totalSets}`
        });
    }

    // Update timer display (for rest periods)
    updateTimer(seconds) {
        this.timerValue = seconds;

        // Update metadata to show timer
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timerText = `${minutes}:${secs.toString().padStart(2, '0')}`;

        this.updateMetadata({
            title: `⏱️ Rest: ${timerText}`,
            artist: this.currentExercise || 'Recupero'
        });

        // Update position state if supported
        if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
                duration: seconds || 1,
                playbackRate: 1,
                position: 0
            });
        }
    }

    // Start timer countdown on lockscreen
    startTimerDisplay(initialSeconds, onTick, onComplete) {
        this.stopTimerDisplay(); // Clear any existing timer

        let remainingSeconds = initialSeconds;
        this.updateTimer(remainingSeconds);

        this.timerInterval = setInterval(() => {
            remainingSeconds--;
            this.updateTimer(remainingSeconds);

            onTick?.(remainingSeconds);

            if (remainingSeconds <= 0) {
                this.stopTimerDisplay();
                onComplete?.();
            }
        }, 1000);

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    }

    // Stop timer display
    stopTimerDisplay() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing'; // Keep playing to maintain session
        }
    }

    // End workout session
    endWorkout() {
        this.isActive = false;
        this.stopTimerDisplay();

        this.updateMetadata({
            title: 'Allenamento Completato',
            artist: 'IRONFLOW',
            album: this.currentWorkoutName
        });

        if (this.audioElement) {
            this.audioElement.pause();
        }

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }
    }

    // Set callback for play/pause button
    onPlayPauseCallback(callback) {
        this.onPlayPause = callback;
    }

    // Set callback for previous track
    onPreviousCallback(callback) {
        this.onPrevious = callback;
    }

    // Set callback for next track
    onNextCallback(callback) {
        this.onNext = callback;
    }
}

// Export singleton instance
export const mediaSessionManager = new MediaSessionManager();
