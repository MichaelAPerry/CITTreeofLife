import { useState } from 'react';
import type { VideoRef } from '../types';
import { parseYouTubeId } from '../lib/youtube';

const NOTE_PROMPTS = [
  'What does a typical day or task actually look like?',
  'What skills or education did they say mattered most?',
  'What do they enjoy — or find challenging — about the job?',
  'What surprised you, or what would you ask a follow-up about?',
];

interface InterviewExpertProps {
  careerName: string;
  videos: VideoRef[];
  searchQuery: string | null;
  customVideoId: string;
  onCustomVideoIdChange: (id: string) => void;
  notes: [string, string, string, string];
  onNoteChange: (index: number, value: string) => void;
}

export default function InterviewExpert({
  careerName,
  videos,
  searchQuery,
  customVideoId,
  onCustomVideoIdChange,
  notes,
  onNoteChange,
}: InterviewExpertProps) {
  const [inputValue, setInputValue] = useState(customVideoId);
  const [error, setError] = useState<string | null>(null);

  const activeVideoId = customVideoId || videos[0]?.youtubeId || '';
  const searchUrl = searchQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(`day in the life of a ${careerName}`)}`;

  const handleEmbed = () => {
    const id = parseYouTubeId(inputValue);
    if (!id) {
      setError('Could not read a video ID from that link. Paste a full YouTube URL or the 11-character video ID.');
      return;
    }
    setError(null);
    onCustomVideoIdChange(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-sm text-slate-600">
          Find a real interview or "day in the life" video, then paste the link below to watch it here.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste a YouTube video URL or ID"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleEmbed}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Embed video
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        <a
          href={searchUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline"
        >
          🔎 Search YouTube for "{searchQuery ?? `day in the life of a ${careerName}`}"
        </a>
      </div>

      {activeVideoId ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-black">
          <iframe
            key={activeVideoId}
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${activeVideoId}`}
            title="Interview video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-400">
          No video embedded yet — search above, or ask your teacher for a curated link.
        </div>
      ) : null}

      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {videos.map((v) => (
            <button
              key={v.youtubeId}
              onClick={() => onCustomVideoIdChange(v.youtubeId)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeVideoId === v.youtubeId
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Interview notes scratchpad</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NOTE_PROMPTS.map((prompt, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">{prompt}</label>
              <textarea
                value={notes[i]}
                onChange={(e) => onNoteChange(i, e.target.value)}
                rows={3}
                className="rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Type your notes here…"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
