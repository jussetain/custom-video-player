import { useState, useImperativeHandle, forwardRef, useRef, ForwardedRef } from "react";

import { BsFillFastForwardFill } from "react-icons/bs";
import { FaPlay, FaPause } from "react-icons/fa";

export enum Type {
    FORWARD,
    BACKWARD,
    PAUSE,
    PLAY,
    MUTE,
    UNMUTE,
}

export interface NavigationRef {
    ping: () => void;
    hide: () => void;
}

export interface NavigationProps {
    type?: Type | null,
    step?: number
}

export const NavigationOverlay = forwardRef<NavigationRef, NavigationProps>((props, ref: ForwardedRef<NavigationRef>) => {

    const [pinged, setPinged] = useState<boolean>(false);

    const timeoutRef = useRef<number | undefined>();

    const ping = () => {
        clearTimeout(timeoutRef.current);
        setPinged(true);
        timeoutRef.current = setTimeout(() => setPinged(false), 1000);
    };

    const hide = () => setPinged(false);

    useImperativeHandle(ref, () => ({
        ping,
        hide
    }));

    const getOffset = () => {
        if (props.type === Type.FORWARD) {
            return pinged ? 'mr-0' : 'mr-10'
        } else if (props.type === Type.BACKWARD) {
            return pinged ? 'ml-0' : 'ml-10'
        }
    }

    const getIcon = () => {
        if (props.type === Type.FORWARD) {
            return <BsFillFastForwardFill />
        } else if (props.type === Type.BACKWARD) {
            return <BsFillFastForwardFill className="rotate-180" />
        } else if (props.type === Type.PAUSE) {
            return <FaPause />
        } else if (props.type === Type.PLAY) {
            return <FaPlay />
        }
    }

    const translateAnimation = getOffset();

    return <div className={`text-white h-12 w-12 rounded-full font-bold items-center transition-all ${pinged ? 'duration-50' : 'duration-300'} ${pinged ? 'opacity-1' : 'opacity-0'} ${translateAnimation} justify-center text-center bg-white/25 flex`}>
        <div className="flex flex-row">
            {
                getIcon()
            }
        </div>
    </div>
})
