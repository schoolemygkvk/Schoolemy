/**
 * ISSUE #47 FIX 3.47.10: Audio Player Logic (Custom Hook)
 * Manages entire audio playback lifecycle, state persistence, and progress tracking
 */

import { useEffect, useCallback, useRef } from "react";

/**
 * useAudioHandlers
 * Complete audio player management with lifecycle, persistence, and sync
 * @param {Object} params - All audio-related state and refs
 * @returns {Object} - Audio control functions and helpers
 */
export const useAudioHandlers = ({
  courseId,
  storageUserId,
  selectedLesson,
  selectedLessonRef,
  currentAudioFileIndex,
  currentAudioFileIndexRef,
  chaptersRef,
  chapters,
  isPlaying,
  duration,
  completedAudioFiles,
  audioRef,
  progressBarRef,
  volumeBarRef,
  playOnLoadRef,
  audioRetryRef,
  progressUpdaterRef,
  pendingProgressUpdatesRef,
  // Setters
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  setPlaybackRate,
  setShowPlaybackOptions,
  setAudioLoadError,
  setCurrentAudioFileIndex,
  setCompletedAudioFiles,
  setUserProgress,
  getSafeLessonMediaUrl,
  progressStorageKey,
  id,
}) => {
  // ===== EFFECT 1: Create audio element once on mount =====
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Log every 5 seconds to avoid flooding console
      if (Math.round(audio.currentTime) % 5 === 0 && audio.currentTime > 0) {
        console.log("[AudioHandlers] Time update:", {
          currentTime: audio.currentTime,
          duration: audio.duration,
        });
      }
    };

    const onLoadedMetadata = () => {
      console.log("[AudioHandlers] onLoadedMetadata called:", {
        duration: audio.duration,
        isNaN: isNaN(audio.duration),
      });
      if (isNaN(audio.duration)) return;
      setDuration(audio.duration);
      console.log("[AudioHandlers] Duration set to:", audio.duration);

      const currentLesson = selectedLessonRef.current;
      const currentTrackIndex = currentAudioFileIndexRef.current;
      if (!currentLesson) return;

      try {
        const savedStateRaw = localStorage.getItem(
          `coursePlayerState_${storageUserId}_${id}`
        );
        if (savedStateRaw) {
          const savedState = JSON.parse(savedStateRaw);
          if (
            savedState.selectedLesson &&
            savedState.selectedLesson.chapterIndex === currentLesson.chapterIndex &&
            savedState.selectedLesson.lessonIndex === currentLesson.lessonIndex &&
            savedState.currentAudioFileIndex === currentTrackIndex
          ) {
            const time = savedState.currentTime;
            if (time > 0 && time < audio.duration) {
              audio.currentTime = time;
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }

      if (playOnLoadRef.current) {
        playOnLoadRef.current = false;
        audio.play().catch((e) => console.error("Auto-play failed:", e));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      const currentLesson = selectedLessonRef.current;
      const currentChapters = chaptersRef.current;
      const currentTrackIndex = currentAudioFileIndexRef.current;
      if (!currentLesson || !currentChapters.length) return;

      const lesson =
        currentChapters[currentLesson.chapterIndex]?.lessons[
          currentLesson.lessonIndex
        ];

      // Mark current audio file as completed
      if (lesson?.audioFile && lesson.audioFile[currentTrackIndex]) {
        const audioKey = `${currentLesson.chapterIndex}-${currentLesson.lessonIndex}-${currentTrackIndex}`;
        setCompletedAudioFiles((prev) => {
          const updated = { ...prev, [audioKey]: true };
          localStorage.setItem(`audioCompletion_${id}`, JSON.stringify(updated));
          return updated;
        });
      }

      // Auto-advance to next audio or mark lesson complete
      if (lesson?.audioFile && currentTrackIndex < lesson.audioFile.length - 1) {
        playOnLoadRef.current = true;
        setCurrentAudioFileIndex((prev) => prev + 1);
      } else {
        markLessonComplete(currentLesson.chapterIndex, currentLesson.lessonIndex);
      }
    };

    const onError = (e) => {
      console.error("Audio Error Event", e);
      console.error("Audio Error Code:", audio.error?.code);
      console.error("Current Audio Source:", audio.src);

      const errorCode = audio.error?.code;
      let errorMessage = "An error occurred while loading the audio.";

      if (errorCode === 3) {
        errorMessage = "Audio loading was aborted.";
      } else if (errorCode === 4) {
        errorMessage =
          "Network error: Unable to load audio. Please check your connection and try again. You can download the file as an alternative.";
      } else if (errorCode === 2) {
        errorMessage =
          "The audio file is corrupted or in an unsupported format. Try downloading the file instead.";
      } else if (errorCode === 1) {
        errorMessage =
          "The audio format is not supported by your browser. Try downloading the file instead.";
      }

      setAudioLoadError(errorMessage);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };
  }, []); // Only once on mount

  // ===== EFFECT 2: Switch audio source when lesson/track changes =====
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !chapters.length) {
      console.warn("[AudioHandlers] Missing audio element or chapters");
      return;
    }

    const lesson =
      chapters[selectedLesson?.chapterIndex]?.lessons[
        selectedLesson?.lessonIndex
      ];
    const audioFile = lesson?.audioFile?.[currentAudioFileIndex];
    const rawAudioUrl = audioFile?.url || "";
    const newSrc = rawAudioUrl
      ? getSafeLessonMediaUrl(rawAudioUrl, "audio") || ""
      : "";

    console.log("[AudioHandlers] EFFECT2 triggered:", {
      rawAudioUrl: rawAudioUrl ? "exists" : "missing",
      newSrc: newSrc ? "valid" : "invalid",
      currentSrc: audio.src,
      srcChanged: audio.src !== newSrc,
    });

    if (audio.src !== newSrc) {
      audioRetryRef.current = { count: 0, maxRetries: 3, currentUrl: newSrc };

      if (rawAudioUrl && !newSrc) {
        console.error("[AudioHandlers] URL validation failed");
        setAudioLoadError(
          "This audio link could not be verified and was blocked for your security. Please contact support if the problem continues."
        );
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        return;
      }

      if (newSrc) {
        console.log("[AudioHandlers] Setting up audio with URL:", newSrc);

        // Set src FIRST, BEFORE setting handlers
        // This ensures preload="metadata" works
        audio.src = newSrc;

        // Now attach/update handlers
        audio.onerror = (e) => {
          console.error("[AudioHandlers] Audio error event:", {
            code: audio.error?.code,
            message: audio.error?.message,
            src: audio.src,
          });
          setAudioLoadError(
            "Failed to load audio. Please check your connection or try downloading the file."
          );
        };

        audio.onloadedmetadata = () => {
          console.log("[AudioHandlers] Metadata loaded:", {
            duration: audio.duration,
            src: audio.src,
          });
          audioRetryRef.current = {
            count: 0,
            maxRetries: 3,
            currentUrl: newSrc,
          };
          setAudioLoadError(null);
        };

        // Explicitly load the audio resource
        console.log("[AudioHandlers] Calling audio.load()");
        audio.load();
      } else {
        console.warn("[AudioHandlers] No valid audio URL for current audioFile");
        setAudioLoadError(null);
      }

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [selectedLesson, currentAudioFileIndex, chapters, getSafeLessonMediaUrl]);

  // ===== EFFECT 3: Volume/playback rate sync removed =====
  // Note: Volume and playback rate are synced via:
  // - changePlaybackRate() handler (line ~400)
  // - handleVolumeSeek() handler (line ~351)
  // No need for a dedicated effect since handlers manage these

  // ===== EFFECT 4: Save player state periodically and on unload =====
  useEffect(() => {
    const savePlayerState = () => {
      if (selectedLesson && audioRef.current && isPlaying) {
        localStorage.setItem(
          `coursePlayerState_${storageUserId}_${id}`,
          JSON.stringify({
            selectedLesson,
            currentAudioFileIndex,
            currentTime: audioRef.current.currentTime,
          })
        );
      }
    };

    const intervalId = setInterval(savePlayerState, 3000);
    window.addEventListener("beforeunload", savePlayerState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", savePlayerState);
    };
  }, [id, selectedLesson, currentAudioFileIndex, isPlaying, storageUserId]);

  // ===== EFFECT 5: Sync progress to backend every 10 seconds =====
  useEffect(() => {
    if (
      storageUserId === "guest" ||
      !selectedLesson ||
      selectedLesson.type !== "lesson"
    ) {
      return;
    }

    const syncInterval = setInterval(() => {
      if (duration > 0 && chapters[selectedLesson.chapterIndex]?.lessons) {
        const lesson =
          chapters[selectedLesson.chapterIndex].lessons[
            selectedLesson.lessonIndex
          ];
        if (!lesson) return;

        const lessonId = lesson._id;
        const progressPercent = Math.round((audioRef.current.currentTime / duration) * 100);

        // FIX: Validate courseId and lessonId before sending
        if (!id) {
          console.error("[Progress] Missing courseId (id parameter)");
          return;
        }
        if (!lessonId) {
          console.error("[Progress] Missing lessonId from lesson object");
          return;
        }

        console.log("[Progress] Syncing progress:", {
          courseId: id,
          lessonId: String(lessonId),
          progress: progressPercent,
          currentTime: audioRef.current.currentTime,
          duration: duration,
        });

        const updateKey = `${id}:${lessonId}`;
        if (pendingProgressUpdatesRef.current) {
          pendingProgressUpdatesRef.current[updateKey] = {
            courseId: id,
            lessonId: String(lessonId),  // FIX: Ensure lessonId is a string
            progress: progressPercent,
            status: progressPercent >= 95 ? "completed" : "in-progress",
          };
        }

        if (progressUpdaterRef.current?.update) {
          progressUpdaterRef.current.update(id, lessonId, {
            progress: progressPercent,
            status: progressPercent >= 95 ? "completed" : "in-progress",
          });
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [
    selectedLesson,
    isPlaying,
    duration,
    chapters,
    id,
    storageUserId,
    pendingProgressUpdatesRef,
    progressUpdaterRef,
  ]);

  // ===== HANDLER FUNCTIONS =====

  const playPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error("Audio element not found");
      return;
    }

    if (audio.paused) {
      audio.play().catch((e) => console.error("Play failed:", e));
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * audio.duration;

    if (!isNaN(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleVolumeSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !volumeBarRef.current) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));

    audio.volume = newVolume;
    setVolume(Math.round(newVolume * 100));
  }, []);

  const handleAudioItemClick = useCallback(
    (index) => {
      if (!isAudioUnlocked(index)) {
        console.warn(`Audio file ${index} is locked`);
        return;
      }

      setCurrentAudioFileIndex(index);
      playOnLoadRef.current = true;
      setCurrentTime(0);
      setDuration(0);
    },
    []
  );

  const skipToNextAudio = useCallback(() => {
    const lesson =
      chapters[selectedLesson?.chapterIndex]?.lessons[
        selectedLesson?.lessonIndex
      ];
    if (!lesson || !lesson.audioFile) return;

    const nextIndex = currentAudioFileIndex + 1;
    if (nextIndex < lesson.audioFile.length) {
      handleAudioItemClick(nextIndex);
    }
  }, [selectedLesson, currentAudioFileIndex, chapters, handleAudioItemClick]);

  const skipToPrevAudio = useCallback(() => {
    if (currentAudioFileIndex > 0) {
      handleAudioItemClick(currentAudioFileIndex - 1);
    }
  }, [currentAudioFileIndex, handleAudioItemClick]);

  const changePlaybackRate = useCallback((rate) => {
    console.log("[AudioHandlers] Changing playback rate to:", rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackOptions(false);
      console.log("[AudioHandlers] Playback rate changed. Audio element rate:", audioRef.current.playbackRate);
    }
  }, [setPlaybackRate, setShowPlaybackOptions]);

  const isCurrentLessonAudioCompleted = useCallback(() => {
    if (!selectedLesson || selectedLesson.type !== "lesson") return true;

    const lesson =
      chapters[selectedLesson.chapterIndex]?.lessons[
        selectedLesson.lessonIndex
      ];
    if (!lesson) return true;

    // PDFs are considered completed without audio
    if (lesson.pdfFile && lesson.pdfFile.length > 0) return true;
    if (!lesson?.audioFile || lesson.audioFile.length === 0) return true;

    // Check if all audio files are completed
    for (let i = 0; i < lesson.audioFile.length; i++) {
      const audioKey = `${selectedLesson.chapterIndex}-${selectedLesson.lessonIndex}-${i}`;
      if (!completedAudioFiles[audioKey]) {
        return false;
      }
    }

    return true;
  }, [selectedLesson, chapters, completedAudioFiles]);

  const isAudioUnlocked = useCallback(
    (audioIndex) => {
      if (!selectedLesson || selectedLesson.type !== "lesson") return true;

      // First audio is always unlocked
      if (audioIndex === 0) return true;

      // Check if previous audio is completed
      const previousAudioKey = `${selectedLesson.chapterIndex}-${
        selectedLesson.lessonIndex
      }-${audioIndex - 1}`;
      return completedAudioFiles[previousAudioKey] || false;
    },
    [selectedLesson, completedAudioFiles]
  );

  const markLessonComplete = useCallback(
    (chapterIndex, lessonIndex) => {
      const key = `${chapterIndex}-${lessonIndex}`;
      setUserProgress((prev) => {
        const updated = {
          ...prev,
          completedLessons: [...(prev.completedLessons || [])],
        };

        if (!updated.completedLessons.includes(key)) {
          updated.completedLessons.push(key);
          localStorage.setItem(progressStorageKey, JSON.stringify(updated));
        }

        return updated;
      });
    },
    [setUserProgress, progressStorageKey]
  );

  const unlockNextContent = useCallback(
    (chapterIndex, lessonIndex) => {
      markLessonComplete(chapterIndex, lessonIndex);
      // Next content navigation is handled by handleSelectContent in CourseContent
    },
    [markLessonComplete]
  );

  return {
    playPause,
    handleSeek,
    handleVolumeSeek,
    handleAudioItemClick,
    skipToNextAudio,
    skipToPrevAudio,
    changePlaybackRate,
    isCurrentLessonAudioCompleted,
    isAudioUnlocked,
    markLessonComplete,
    unlockNextContent,
  };
};
