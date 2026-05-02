import React, { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaVolumeUp,
  FaVolumeMute,
  FaMusic,
  FaDownload,
} from "react-icons/fa";
import { AiOutlineSetting } from "react-icons/ai";
import { truncateTitle, formatTime } from "../../utils/courseUtils";
import { getSafeLessonMediaUrl, safeLessonDownloadFilename } from "../../../../utils/safeLessonMediaUrl";
import { styles } from "./LessonPlayer.styles";

/**
 * ISSUE #47 FIX 3.47.5: Extracted LessonPlayer Component (Full Implementation)
 * Handles all audio/video player functionality matching inline CourseContent player
 * Responsibilities: Audio controls, seek, volume, playback rate, progress tracking, download
 */

export function LessonPlayer({
  currentLesson,
  duration,
  currentTime,
  isPlaying,
  volume,
  playbackRate,
  currentAudioFileIndex,
  completedAudioFiles,
  audioLoadError,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onAudioItemClick,
  onSkipNext,
  onSkipPrev,
  onDownload,
  onLessonComplete,
  courseId,
  isMobile,
  theme,
  activeColors,
  audioRef,
}) {
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const playbackOptionsRef = useRef(null);

  const audioReady =
    audioRef?.current && duration > 0 && !isNaN(duration);

  // Handle seek on progress bar click
  const handleSeek = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * duration;
    onSeek(newTime);
  };

  // Handle volume bar click
  const handleVolumeSeek = (e) => {
    if (!volumeBarRef.current || !duration) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.round((x / rect.width) * 100);
    onVolumeChange(Math.max(0, Math.min(newVolume, 100)));
  };

  // Close playback options on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        playbackOptionsRef.current &&
        !playbackOptionsRef.current.contains(e.target)
      ) {
        setShowPlaybackOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentLesson) {
    return <div style={styles.container}>No lesson selected</div>;
  }

  // Determine if this is the current lesson and it's audio
  const getHeaderTitle = () => {
    const label =
      currentLesson?.lessonname ||
      currentLesson?.name ||
      currentLesson?.title;
    if (label) return truncateTitle(label);
    return "Course Audio";
  };

  return (
    <div style={styles.playerContainer}>
      {/* Audio Player Area */}
      {currentLesson && currentLesson.audioFile?.length > 0 && (
        <>
          {/* Audio Info Overlay Area */}
          <div style={styles.videoStylePlayerContainer}>
        <div style={styles.playerVisualArea}>
          {/* Audio info overlay with name and icon */}
          <div style={styles.audioInfoOverlay}>
            <div style={styles.audioNameDisplay}>
              {truncateTitle(
                currentLesson?.audioFile?.[currentAudioFileIndex]?.name
              ) || getHeaderTitle()}
            </div>
            <FaMusic style={styles.audioIconTopRight} />
          </div>
        </div>

        {/* Audio Error Message */}
        {audioLoadError && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              borderLeft: "4px solid #ffc107",
              padding: "12px 16px",
              marginTop: "12px",
              borderRadius: "4px",
              color: "#856404",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <strong> Audio Loading Issue:</strong> {audioLoadError}
            </div>
            {currentLesson?.audioFile?.[currentAudioFileIndex]?._id && (
              <button
                onClick={async () => {
                  try {
                    const audioFileId =
                      currentLesson.audioFile[currentAudioFileIndex]._id;
                    const fileName = safeLessonDownloadFilename(
                      currentLesson.audioFile[currentAudioFileIndex].name,
                      "audio.mp3"
                    );

                    const downloadUrl = `/api/resources/download/${courseId}/${audioFileId}/audio`;

                    const response = await fetch(downloadUrl, {
                      method: "GET",
                      credentials: "include", // Send httpOnly cookies automatically
                    });

                    if (!response.ok) {
                      if (response.status === 403) {
                        window.alert(
                          "You don't have permission to download this file."
                        );
                      } else if (response.status === 404) {
                        window.alert("File not found.");
                      } else {
                        window.alert("Download failed. Please try again.");
                      }
                      return;
                    }

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = fileName;
                    const clickEvent = new MouseEvent("click", {
                      bubbles: true,
                    });
                    link.dispatchEvent(clickEvent);
                    setTimeout(() => window.URL.revokeObjectURL(url), 100);
                  } catch (error) {
                    console.error("Download error:", error);
                    window.alert("Download failed. Please try again.");
                  }
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffc107",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Download audio file"
              >
                <FaDownload size="0.9em" /> Download
              </button>
            )}
          </div>
        )}

        {/* Player Controls */}
        {currentLesson && currentLesson.audioFile?.length > 0 && (
          <div style={styles.playerControlsOverlay}>
            {/* Progress Bar Section */}
            <div style={styles.progressContainer}>
              <div style={styles.timeDisplay}>{formatTime(currentTime)}</div>
              <div
                style={styles.progressBar}
                ref={progressBarRef}
                onClick={audioReady ? handleSeek : undefined}
              >
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${(currentTime / duration) * 100}%`,
                  }}
                ></div>
                {audioReady && (
                  <div
                    style={{
                      ...styles.progressThumb,
                      left: `${(currentTime / duration) * 100}%`,
                    }}
                  ></div>
                )}
              </div>
              <div style={styles.timeDisplay}>{formatTime(duration)}</div>
            </div>

          </div>
        )}
          </div>
        </>
      )}

      {/* UNIFIED CONTROLS BAR AT BOTTOM - Play, Volume, Speed */}
      {currentLesson && currentLesson.audioFile?.length > 0 && (
        <div style={{
          padding: "14px 16px",
          backgroundColor: "#f0f8ff",
          borderRadius: "8px",
          marginTop: "14px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          border: "2px solid #007bff",
          flexWrap: "wrap",
        }}>
          {/* Play/Pause and Skip Buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              style={{
                padding: "8px 12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: audioReady ? "pointer" : "not-allowed",
                fontSize: "1rem",
                fontWeight: 600,
              }}
              onClick={onSkipPrev}
              disabled={!audioReady || currentAudioFileIndex === 0}
              title="Previous Track"
            >
              <FaStepBackward />
            </button>
            <button
              style={{
                padding: "10px 16px",
                backgroundColor: isPlaying ? "#dc3545" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: audioReady ? "pointer" : "not-allowed",
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
              onClick={onPlayPause}
              disabled={!getSafeLessonMediaUrl(
                currentLesson.audioFile?.[currentAudioFileIndex]?.url,
                "audio"
              ) || !audioRef.current || isNaN(audioRef.current.duration)}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button
              style={{
                padding: "8px 12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: audioReady ? "pointer" : "not-allowed",
                fontSize: "1rem",
                fontWeight: 600,
              }}
              onClick={onSkipNext}
              disabled={
                !audioReady ||
                currentAudioFileIndex >= currentLesson.audioFile?.length - 1
              }
              title="Next Track"
            >
              <FaStepForward />
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "30px", backgroundColor: "#007bff" }}></div>

          {/* Volume Control */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              style={{
                padding: "6px 10px",
                backgroundColor: "transparent",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: audioReady ? "pointer" : "not-allowed",
                fontSize: "1rem",
                color: audioReady ? "#007bff" : "#ccc",
              }}
              onClick={() => onVolumeChange(volume > 0 ? 0 : 80)}
              disabled={!audioReady}
              title={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <div
              style={{
                width: "80px",
                height: "6px",
                backgroundColor: "#ddd",
                borderRadius: "3px",
                cursor: audioReady ? "pointer" : "not-allowed",
                overflow: "hidden",
              }}
              ref={volumeBarRef}
              onClick={audioReady ? handleVolumeSeek : undefined}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#007bff",
                  width: `${volume}%`,
                }}
              ></div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#333", minWidth: "30px", fontWeight: 600 }}>
              {volume}%
            </span>
          </div>

          {/* Playback Speed Control */}
          <div style={{ position: "relative" }}>
            <button
              style={{
                padding: "8px 14px",
                backgroundColor: playbackRate !== 1.0 ? "#007bff" : "#fff",
                color: playbackRate !== 1.0 ? "#fff" : "#333",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: audioReady ? "pointer" : "not-allowed",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
              onClick={() => setShowPlaybackOptions(!showPlaybackOptions)}
              disabled={!audioReady}
              title="Playback Speed"
            >
              ⚡ {playbackRate.toFixed(1)}x
            </button>
            {showPlaybackOptions && audioReady && (
              <div style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: "4px",
                backgroundColor: "#fff",
                border: "2px solid #007bff",
                borderRadius: "4px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 10,
              }}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <div
                    key={rate}
                    onClick={() => onPlaybackRateChange(rate)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      backgroundColor: playbackRate === rate ? "#e3f2fd" : "transparent",
                      borderLeft: playbackRate === rate ? "4px solid #007bff" : "none",
                      fontWeight: playbackRate === rate ? 700 : 500,
                      color: playbackRate === rate ? "#007bff" : "#333",
                      borderBottom: "1px solid #f0f0f0",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = playbackRate === rate ? "#e3f2fd" : "transparent"}
                  >
                    {rate.toFixed(2)}x Speed
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Audio Info */}
          <div style={{ marginLeft: "auto", fontSize: "0.9rem", color: "#333", fontWeight: 600 }}>
            🎵 {currentAudioFileIndex + 1}/{currentLesson.audioFile.length}
          </div>
        </div>
      )}
    </div>
  );
}
