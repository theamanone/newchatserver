'use client';

import useOutsideClick from "@/utils/documentOutSideClick";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { IoClose, IoDownloadOutline, IoExpand, IoContract, IoPlayCircleOutline, IoPauseCircleOutline, IoReloadCircleOutline } from "react-icons/io5";
import { IoReloadOutline } from "react-icons/io5";


interface MediaPreviewProps {
  isOpen: boolean;
  fileUrl: string;
  fileType: string;
  onClose: () => void;
  avatarPreview?: boolean;
  fileName?: string;
  controls?: boolean
}

const FullscreenMediaPreview: React.FC<MediaPreviewProps> = ({
  isOpen,
  fileUrl,
  fileType,
  onClose,
  avatarPreview = false,
  fileName,
  controls = true
}) => {
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useOutsideClick(mediaContainerRef, () => {
    if (!isDragging) onClose();
  });

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        setError("Fullscreen not supported");
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || `download.${fileType.split("/").pop()}`;
    link.click();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale !== 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTranslate({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => setIsLoaded(true), 50);
    } else {
      document.body.style.overflow = "unset";
      setIsLoaded(false);
      resetZoom();
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const hideControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isOpen) {
      hideControlsTimer();
      window.addEventListener('mousemove', hideControlsTimer);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      window.removeEventListener('mousemove', hideControlsTimer);
    };
  }, [isOpen, isDragging]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={mediaContainerRef}
        className={`relative w-full h-full flex items-center justify-center ${isDragging ? "cursor-grabbing" : scale !== 1 ? "cursor-grab" : ""
          }`}
      >
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded">
            {error}
          </div>
        )}

        {!controls && <div
          className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0"
            }`}
        >
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>}

        {controls && <div
          className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0"
            }`}
        >
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <IoClose size={24} />
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRotate}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <IoReloadCircleOutline size={24} />
            </button>
            <button
              onClick={zoomIn}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <IoExpand size={24} />
            </button>
            <button
              onClick={zoomOut}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <IoContract size={24} />
            </button>
            <button
              onClick={handleDownload}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <IoDownloadOutline size={24} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <IoExpand size={24} />
            </button>
          </div>
        </div>}

        <div
          className="transform-gpu transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
          onMouseDown={handleMouseDown}
        >
          {fileType.startsWith("image") ? (
            <Image
              src={fileUrl}
              alt="Preview"
              width={1920}
              height={1080}
              className="max-h-[90vh] w-auto object-contain"
              onLoadingComplete={() => setIsLoaded(true)}
              priority
            />
          ) : fileType.startsWith("video") ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={fileUrl}
                className="max-h-[90vh] w-auto"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlayPause}
              />
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0"
                  }`}
              >
                <div
                  className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlayPause}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {isPlaying ? (
                        <IoPauseCircleOutline size={32} />
                      ) : (
                        <IoPlayCircleOutline size={32} />
                      )}
                    </button>
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <p>Unsupported file type</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullscreenMediaPreview;
