import React, { useRef, useState } from "react";
import { MdOutlineSubtitles } from "react-icons/md";
import { MdOutlineSpeed } from "react-icons/md";
import { MdHighQuality } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaCheck } from "react-icons/fa6";

const Item = ({
    icon,
    name,
    value,
    onClick
}: {
    icon?: React.ReactNode,
    name: string,
    value?: string | React.ReactNode
    onClick?: () => void
}) => {
    return <li className="py-2 px-4 hover:bg-white/20 hover:cursor-pointer flex justify-between transition-colors duration-75 gap-4" onClick={onClick}>
        <div className="flex items-center gap-2 grow whitespace-nowrap">
            {icon}
            <div>{name}</div>
        </div>
        <div className="truncate grow-0">
            {value}
        </div>
    </li>
}

const PlaybackMenu = ({ onPlaybackChanged, onReturn, value }: { onPlaybackChanged: (speed: number) => void, onReturn: () => void, value: number }) => {
    return <React.Fragment>
        <Item icon={<IoMdArrowRoundBack />} name={"retour"} onClick={onReturn} />
        <Item icon={value === 0.25 && <FaCheck color="white" />} name={"x0.25"} onClick={() => onPlaybackChanged(0.25)} />
        <Item icon={value === 0.5 && <FaCheck color="white" />} name={"x0.5"} onClick={() => onPlaybackChanged(0.5)} />
        <Item icon={value === 0.75 && <FaCheck color="white" />} name={"x0.75"} onClick={() => onPlaybackChanged(0.75)} />
        <Item icon={value === 1 && <FaCheck color="white" />} name={"Normale"} onClick={() => onPlaybackChanged(1)} />
        <Item icon={value === 1.25 && <FaCheck color="white" />} name={"x1.25"} onClick={() => onPlaybackChanged(1.25)} />
        <Item icon={value === 1.5 && <FaCheck color="white" />} name={"x1.5"} onClick={() => onPlaybackChanged(1.5)} />
        <Item icon={value === 1.75 && <FaCheck color="white" />} name={"x1.75"} onClick={() => onPlaybackChanged(1.75)} />
        <Item icon={value === 2 && <FaCheck color="white" />} name={"x2"} onClick={() => onPlaybackChanged(2)} />
    </React.Fragment>
}

export const Settings = ({ quality, speed = 1, onPlaybackChanged, onSubtitlesLoaded }: { quality: number, speed?: number, onPlaybackChanged: (speed: number) => void, onSubtitlesLoaded: (srt: string) => void }) => {
    const [playbackOpen, setPlaybackOpen] = useState<boolean>(false);
    const [localSpeed, setLocalSpeed] = useState<number>(speed);
    const [localSubtitles, setLocalSubtitles] = useState<any>();

    const uploadRef = useRef<HTMLInputElement>(null);

    return <ul className="bg-black/75 text-white rounded flex flex-col py-2 text-xs">
        {
            playbackOpen ? <div className="h-40 overflow-hidden">
                <div className="h-40 overflow-y-auto">
                    <PlaybackMenu
                        onPlaybackChanged={(speed: number) => {
                            setPlaybackOpen(false);
                            onPlaybackChanged(speed);
                            setLocalSpeed(speed);
                        }}
                        onReturn={() => setPlaybackOpen(false)}
                        value={localSpeed}
                    />
                </div>
            </div> : (
                <React.Fragment>
                    <div>
                        <div onClick={() => {
                            if (uploadRef.current) {
                                uploadRef.current.click();
                            }
                        }}>
                            <Item
                                icon={<MdOutlineSubtitles />}
                                name={"Sous-titres"}
                                value={<i className="font-thin">{localSubtitles}</i> || <i className="font-thin">Aucun</i>} />
                        </div>
                        <input
                            className="hidden"
                            ref={uploadRef}
                            type="file"
                            accept=".srt"
                            onChange={(event: any) => {
                                const file = event.target.files[0];
                                if (file.name.split(".")[file.name.split(".").length - 1] !== "srt") {
                                    return;
                                }
                                if (file) {
                                    setLocalSubtitles(file.name);
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                        onSubtitlesLoaded(e.target?.result as string);
                                    };
                                    reader.onerror = (e) => {
                                        console.error('Error reading file:', e.target?.error);
                                    };
                                    reader.readAsText(file);
                                }
                            }} />
                    </div>
                    <Item
                        icon={<MdOutlineSpeed />}
                        name={"Vitesse de lecture"}
                        value={`x${localSpeed}`}
                        onClick={() => setPlaybackOpen(true)} />
                    <Item
                        icon={<MdHighQuality />}
                        name={"Qualité"}
                        value={`${quality}p`} />
                </React.Fragment>
            )
        }

    </ul>
}
