import { useEffect, useRef, useState } from "react";

export const Slider = ({
    onUpdate,
    onDragStarts,
    onDragEnds,
    progress,
    buffers
}: {
    onUpdate: any,
    onDragStarts?: any,
    onDragEnds?: any,
    progress: number,
    buffers?: any
}) => {
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [_, setLocalProgress] = useState<number>(progress);

    useEffect(() => {
        setLocalProgress(progress)
    }, [progress]);

    useEffect(() => {
        // containerRef.current?.addEventListener('wheel', (event: WheelEvent) => {

        // }, { passive: false })
    }, []);

    const [dragging, setDragging] = useState<boolean>(false);

    const update = (event: React.DragEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!progressRef.current) return;
        const { x, width } = progressRef.current.getBoundingClientRect();
        const value = Math.max(Math.min(((event.clientX - x) / width), 1), 0);
        setLocalProgress(value);
        onUpdate(value)
    }

    return <div className="h-4 flex items-center !cursor-pointer"
        ref={containerRef}
        onDragStart={(e) => {
            onDragStarts();
            var img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(img, 0, 0);
        }}
        onDrag={(e) => {
            e?.preventDefault()
            update(e);
            setDragging(true);
            onDragStarts();
        }}
        onDragEnterCapture={(e) => {
            e.preventDefault();
        }}
        onDragLeaveCapture={(e) => {
            e.preventDefault()
        }}
        onDragLeave={(e) => {
            e.preventDefault();
        }}
        onDragOver={(e) => {
            e.preventDefault();
        }}
        onDragEnter={(e) => {
            e.preventDefault();
        }}
        onDragEnd={(e) => {
            update(e);
            e.preventDefault();
            setDragging(false);
            onDragEnds();
        }}
        onMouseDown={(e) => {
            update(e);
            setDragging(true);
            onDragStarts();
        }}
        onMouseUp={(e) => {
            update(e);
            setDragging(false);
            onDragEnds()
        }}>
        <div ref={progressRef} className="h-1 bg-white/35 relative grow  !cursor-pointer">
            <div className={`h-1 ${dragging ? "bg-blue-400" : "bg-blue-500"}  relative ${dragging ? "" : "transition-all duration-0"} z-20 !cursor-pointer`}
                style={{
                    width: (progress * 100) + "%"
                }}
            >
            </div>
            <div className="flex z-30 absolute -top-3 p-2 !cursor-pointer drag overflow-hidden" style={{
                left: `calc(${(progress * 100) + "%"} - 14px)`
            }} draggable={true}>
                <div className={`h-3 w-3 grow ${dragging ? "bg-blue-400" : "bg-blue-500"} rounded-full border ${dragging ? "border-blue-400" : "border-blue-500"}`}>

                </div>
            </div>
            {
                buffers && buffers.map((segment: any, index: number) => {
                    const { duration, offset } = segment;
                    return <div key={index} className={`h-1 bg-white/50 absolute top-0 transition-all z-10 `} style={{
                        width: (duration * 100) + "%",
                        left: (offset * 100) + "%"
                    }}></div>
                })
            }
        </div>
    </div>
}
