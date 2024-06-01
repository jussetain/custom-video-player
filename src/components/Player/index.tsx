import { useRef, useState } from "react"

import { FaPlay, FaPause } from "react-icons/fa";
import { CgSpinnerAlt } from "react-icons/cg";
import { FaVolumeUp } from "react-icons/fa";
import { FaVolumeMute } from "react-icons/fa";
import { GoScreenFull, GoScreenNormal } from "react-icons/go";
import { FaGear } from "react-icons/fa6";

import { Slider } from "../Slider";
import { Type, NavigationOverlay, NavigationRef } from "../NavigationOverlay";
import { Settings } from "../Settings";
import { Subtitles } from "../Subtitles";

import "./style.css"

enum VideoState {
    BUFFERING,
    PLAYING,
    PAUSED,
    ENDED
}

const strTimeToMilliseconds = (str: string) => {
    const [left, right] = str.split(',');
    const [hours, minutes, seconds] = left.split(":");
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) * 1 + (Number(right) / 1000);
}

const getSubtitleFromTimestamp = (subtitles: any, timecode: number, delay: number) => {
    if (!subtitles) return;
    const r = subtitles.filter((s: any) => {
        if (!s) return false;
        return (s.timestamp.start + delay) <= timecode && (s.timestamp.end + delay) >= timecode;
    });

    if (!r || r.length <= 0) {
        return ""
    }

    const { rows }: any = r[0];

    if (!rows) return "";

    return rows;
}

const textToStr = (str: string) => {
    const rawBlocs = str.split(/\n\s*\n/);
    return rawBlocs.map((str: string) => {
        const [index, timestamp, ...rows] = str.split('\r\n');
        try {
            const [start, end] = timestamp.split(" --> ")
            return {
                index,
                timestamp: {
                    start: strTimeToMilliseconds(start),
                    end: strTimeToMilliseconds(end),
                },
                rows: rows.map((r) => r.replace('\r', ''))
            }
        } catch (err) { }
    });
}

export const Player = ({
    source,
}: {
    source: string,
}) => {

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const forwardRef = useRef<NavigationRef>(null);
    const backwardRef = useRef<NavigationRef>(null);
    const pauseRef = useRef<NavigationRef>(null);
    const playRef = useRef<NavigationRef>(null);

    const hoverRef = useRef<number | null>(null);
    const moveRef = useRef<number | null>(null);

    const [status, setStatus] = useState<VideoState>(VideoState.PAUSED);
    const [buffered, setBuffered] = useState<any>();
    const [currentTime, setCurrentTime] = useState<number | undefined>(0);
    const [_, setPlaybackSpeed] = useState<number | undefined>(1);
    const [muted, setMuted] = useState<boolean>(false);
    const [isFullscreen, setIsFullscren] = useState<boolean>(false);
    const [duration, setDuration] = useState<number | undefined>(0);
    const [soundHovered, setSoundHovered] = useState<boolean>(false);
    const [hovered, setHovered] = useState<boolean>(false);
    const [fullscreenTriggerDate, setFullscreeTriggerDate] = useState<Date | null>(null);
    const [settings, setSettings] = useState<boolean>(false);
    const [subtitles, setSubtitles] = useState<any>("");

    const TIME_STEP = 10;

    const formatTimestamp = (timestamp: number | undefined): string => {
        if (!timestamp) return '00:00';

        const seconds = Math.floor(timestamp);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const pad = (num: number): string => num.toString().padStart(2, '0');

        return `${seconds >= 3600 ? `${pad(hours)}:` : ''}${pad(minutes)}:${pad(secs)}`;
    }

    const timeToProgress = (time: number | undefined) => {
        if (!time || !duration) return 0;
        return (time / duration);
    }

    const play = () => {
        if (!videoRef.current) return;

        if (status === VideoState.PLAYING) {
            videoRef.current.pause();
            setStatus(VideoState.PAUSED);
            if (playRef.current) {
                playRef.current.hide();
            }
            if (pauseRef.current) {
                pauseRef.current.ping();
            }
        } else {
            if (pauseRef.current) {
                pauseRef.current.hide();
            }
            if (playRef.current) {
                playRef.current.ping();
            }
            videoRef.current.play();
            setStatus(VideoState.PLAYING);
        }
    }

    const silentPlay = (status: VideoState) => {
        if (!videoRef.current) return;

        setStatus(status);

        if (status === VideoState.PAUSED) {
            videoRef.current.pause();
        } else if (status === VideoState.PLAYING) {
            videoRef.current.play();
        }
    }

    const onTimeUpdates = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    }

    const onMetadataLoaded = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
    }

    const onProgress = () => {
        const buf = videoRef.current?.buffered;
        if (!buf) return;
        if (buf.length > 0) {
            const buffers = [];
            for (let i = 0; i < buf.length; i++) {
                const length = videoRef.current?.buffered.end(i) - videoRef.current?.buffered.start(i);
                buffers.push({
                    duration: length / (duration || 1),
                    offset: videoRef.current?.buffered.start(i) / (duration || 1),
                })
            }
            setBuffered(buffers)
        }
    }

    const onRateChanged = () => {
        if (!videoRef.current) return;
        setPlaybackSpeed(videoRef.current.playbackRate);
    }

    const getVolumeLevel = (): number => {
        if (!videoRef.current) return 0;
        return videoRef.current.muted ? 0 : videoRef.current.volume
    }

    const setTime = (value: number) => {
        if (!videoRef.current) return;
        const timestamp = (duration || 0) * value;
        videoRef.current.currentTime = timestamp;
    }

    const setCurrentVolume = (value: number) => {
        if (!videoRef.current) return;
        videoRef.current.muted = false;
        setMuted(false);
        const level = 1 * value;
        videoRef.current.volume = level;
    }

    const requestFullScreen = () => {
        if (!containerRef.current) return;
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen();
            setIsFullscren(true);
        } else {
            document.exitFullscreen();
            setIsFullscren(false);
        }
    }

    const stepCurrentTime = (step: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(Math.min(videoRef.current.currentTime + step, duration || 0), 0);
    }

    const stepVolume = (step: number) => {
        if (!videoRef.current) return;
        videoRef.current.volume = Math.max(Math.min(videoRef.current.volume + step, 1), 0);;
    }

    const toogleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setMuted(videoRef.current.muted);
    }

    const setSpeed = (speed: number) => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = speed;
    }

    const handleKeyStroke = (event: React.KeyboardEvent<HTMLVideoElement | HTMLDivElement>) => {
        switch (event.code) {
            case "Space":
                play();

                break;
            case "ArrowLeft":
                stepCurrentTime(-TIME_STEP);
                if (forwardRef.current) {
                    forwardRef.current.hide();
                }
                if (backwardRef.current) {
                    backwardRef.current.ping();
                }
                break;
            case "ArrowRight":
                stepCurrentTime(TIME_STEP);
                if (backwardRef.current) {
                    backwardRef.current.hide();
                }
                if (forwardRef.current) {
                    forwardRef.current.ping();
                }
                break;
            case "ArrowUp": stepVolume(0.1); break;
            case "ArrowDown": stepVolume(-0.1); break;
            case "KeyF": requestFullScreen(); break;
            case "Semicolon": toogleMute(); break;
            default: break;
        }
        return;
    }

    const getVideoQuality = () => {
        if (videoRef.current) {
            return videoRef.current.videoHeight
        }
        return 0;
    }

    const handleHover = (show: boolean) => {
        if (show) {
            if (hoverRef.current) {
                clearTimeout(hoverRef.current);
                setHovered(true)
            }
        } else if (!show) {
            hoverRef.current = setTimeout(() => {
                setHovered(false);
                if (hoverRef.current) {
                    clearTimeout(hoverRef.current)
                }
            }, 500);
        }
    }

    const hoverClasses = `transition-all h-20 ${(hovered || status !== VideoState.PLAYING) ? 'opacity-1' : 'max-h-0 opacity-0'}`;

    return <div
        ref={containerRef}
        tabIndex={1}
        onKeyDown={handleKeyStroke}
        className="w-full h-full max-h-54 relative shadow-md select-none font-semibold"
        onMouseEnter={() => {
            handleHover(true);
        }}
        onMouseLeave={() => {
            if (!settings) {
                handleHover(false);
            }
        }}
        onWaiting={() => {
            if (status === VideoState.PLAYING) {
                setStatus(VideoState.BUFFERING);
            }
        }}
        onCanPlay={() => {
            if (status === VideoState.BUFFERING) {
                setStatus(VideoState.PLAYING);
            }
        }}
        onMouseMove={() => {
            handleHover(true);
            if (moveRef.current) {
                clearTimeout(moveRef.current)
            }
            moveRef.current = setTimeout(() => {
                if (!settings) {
                    handleHover(false);
                }
            }, 3000)
        }}
    >

        <div className={`w-full h-full absolute items-center transition-all justify-center p-8 duration-100 align-middle rounded-md z-10 ${status !== VideoState.PLAYING && "bg-black/30"}`}>
            <div className="flex justify-between align-middle items-center h-full ">
                <NavigationOverlay ref={backwardRef} type={Type.BACKWARD} step={-TIME_STEP} />
                <div className="flex absolute left-0 right-0 top-0 bottom-0 justify-center items-center">
                    <div className="absolute">
                        <NavigationOverlay ref={pauseRef} type={Type.PAUSE} />
                    </div>
                    <div className="absolute">
                        <NavigationOverlay ref={playRef} type={Type.PLAY} />
                    </div>
                </div>
                <NavigationOverlay ref={forwardRef} type={Type.FORWARD} step={TIME_STEP} />
            </div>

        </div>

        <div
            id="clic-overlay"
            className={`w-full h-full absolute flex justify-center items-center transition-all duration-75 align-middle rounded-md z-20 ${status !== VideoState.PLAYING && "bg-black/10"}`} onClick={() => {
                const previousDate = fullscreenTriggerDate;
                setFullscreeTriggerDate(new Date());
                if (previousDate && Math.abs(previousDate?.getTime() - new Date().getTime()) < 300) {
                    setFullscreeTriggerDate(new Date(new Date().getTime() - 300));
                    requestFullScreen();
                }
                play();
            }} >
            {
                status === VideoState.BUFFERING && <div className="scale-150"><CgSpinnerAlt color="white" className="animate-spin" /></div>
            }
        </div>

        <div className={`${(hovered || status !== VideoState.PLAYING) ? 'opacity-1' : 'opacity-0'} z-20 transition-all flex flex-col gap-3 rounded-t-md bg-gradient-to-b from-black to-transparent w-full absolute top-0 py-4 px-4 text-white duration-200`}>
            {decodeURIComponent(source.split('/')[source.split('/').length - 1])}
        </div>



        <video
            ref={videoRef}
            className="w-full object-fill rounded-md flex justify-center align-middle items-center text-center"
            onTimeUpdate={onTimeUpdates}
            onLoadedMetadata={onMetadataLoaded}
            onProgress={onProgress}
            onRateChange={onRateChanged}>
            <source src={source} className="z-10" >
            </source>
        </video>

        <div className={`z-20 flex flex-col items-center rounded-b-md w-full justify-end absolute bottom-0 duration-200`}
            style={{
                zIndex: "2147483647"
            }}>
            <div className={`max-w-2/3 pb-6`}>
                <Subtitles content={getSubtitleFromTimestamp(subtitles, (currentTime || 0), 0)} />
            </div>
            <div className={`${hoverClasses} h-auto w-full rounded-b-md  flex flex-col gap-2 bg-gradient-to-t from-black to-transparent`}>
                <div className={`m-4 absolute bottom-12 duration-200 flex w-full justify-end right-0 transition-all ${settings ? 'opacity-1' : 'opacity-0 hidden'}`} >
                    <div className={`w-72`}>
                        <Settings
                            quality={getVideoQuality()}
                            onPlaybackChanged={setSpeed}
                            onSubtitlesLoaded={(str: string) => {
                                setSubtitles(textToStr(str));
                            }}
                        />
                    </div>
                </div>

                <div className={`z-20 w-full px-4 overflow-hidden`}>
                    <Slider
                        onUpdate={setTime}
                        onDragEnds={() => silentPlay(VideoState.PLAYING)}
                        onDragStarts={() => silentPlay(VideoState.PAUSED)}
                        progress={timeToProgress(currentTime)}
                        buffers={buffered}
                    />
                </div>


                <div className={`flex justify-between pb-4 px-4 overflow-hidden transition-all`}>
                    <div className="flex gap-5 items-center">
                        {
                            (status === VideoState.PLAYING || status === VideoState.BUFFERING) && <FaPause onClick={play} className="hover:cursor-pointer" color="white" />
                        }
                        {
                            status === VideoState.PAUSED && <FaPlay onClick={play} className="hover:cursor-pointer" color="white" />
                        }
                        <div className="flex flex-row items-center gap-2 "
                            onMouseEnter={() => {
                                setSoundHovered(true);
                            }}
                            onMouseLeave={() => {
                                setSoundHovered(false)
                            }}>
                            {
                                (muted || videoRef.current?.volume === 0) ? <FaVolumeMute className="hover:cursor-pointer" color="white" onClick={toogleMute} /> : <FaVolumeUp className="hover:cursor-pointer" color="white" onClick={toogleMute} />
                            }
                            <div className={`overflow-clip transition-all ${soundHovered ? "w-20 px-2" : "w-0 p-0"}`}>
                                <Slider
                                    onUpdate={setCurrentVolume}
                                    progress={getVolumeLevel()}
                                />
                            </div>
                        </div>
                        <div className="text-white text-xs ">
                            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                        </div>
                    </div>
                    <div className="flex gap-5 items-center ">
                        <FaGear onClick={() => {
                            setSettings(!settings);
                        }} color="white" className="cursor-pointer transition-all hover:rotate-90" />
                        <div className="transition-all hover:scale-125">
                            {
                                isFullscreen ? <GoScreenNormal className="hover:cursor-pointer" color="white" onClick={requestFullScreen} /> : <GoScreenFull className="hover:cursor-pointer" color="white" onClick={requestFullScreen} />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
