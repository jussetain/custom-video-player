export const Subtitles = ({ content }: { content: Array<string> }) => {
    if (!content) return;
    return <div className="bg-black/30 px-4 py-1 rounded-lg text-[1.75vw] font-medium">
        {
            content.map((row, index) => {
                return <div key={index} className="text-center text-white">{row}</div>
            })
        }
    </div>
}
