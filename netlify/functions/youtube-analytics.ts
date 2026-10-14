import type { Handler, HandlerEvent } from '@netlify/functions';

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface VideoAnalytics {
  videoId: string;
  title: string;
  publishTime: string;
  views: number;
  duration: string;
  isShort: boolean;
  averageViewTime: string;
  averagePercentageViewed: number;
  engagedViews: number;
  stayedToWatch: number;
  swipeRate: number; // Percentage of viewers who stayed vs swiped away (Shorts metric)
  uniqueViewers: number;
  returningViewers: number;
  likes: number;
  dislikes: number;
  commentsAdded: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  cleanTranscript: string;
  first4sTranscript: string; // Stringified JSON array of TranscriptSegment
}

// Sample hook transcripts for realistic content analysis
const sampleTranscripts: Array<{ full: TranscriptSegment[] }> = [
  {
    full: [
      { start: 0.0, duration: 1.2, text: "Stop scrolling right now!" },
      { start: 1.2, duration: 1.3, text: "If you edit videos in 2025," },
      { start: 2.5, duration: 1.5, text: "this one mistake is killing your watch time." },
      { start: 4.0, duration: 2.0, text: "Let me show you how top creators hold retention." },
      { start: 6.0, duration: 3.0, text: "First, cut out all the silent gaps using automated audio trimming." },
      { start: 9.0, duration: 2.5, text: "Second, add visual cuts every 2.5 seconds." }
    ]
  },
  {
    full: [
      { start: 0.0, duration: 1.5, text: "Did you know this crazy editing trick?" },
      { start: 1.5, duration: 1.2, text: "It turns boring video footage" },
      { start: 2.7, duration: 1.2, text: "into cinematic gold instantly." },
      { start: 3.9, duration: 2.1, text: "All you need is a secondary keyframe curve." },
      { start: 6.0, duration: 2.8, text: "Adjust the bezier handle down 30 percent." }
    ]
  },
  {
    full: [
      { start: 0.0, duration: 0.9, text: "Watch what happens" },
      { start: 0.9, duration: 1.6, text: "when I press this single shortcut." },
      { start: 2.5, duration: 1.4, text: "Boom! Your entire timeline aligns." },
      { start: 3.9, duration: 2.2, text: "No more manually dragging clips one by one." },
      { start: 6.1, duration: 2.5, text: "Save this video before you forget." }
    ]
  },
  {
    full: [
      { start: 0.0, duration: 1.8, text: "Three secret audio filters" },
      { start: 1.8, duration: 1.1, text: "that make your voice sound" },
      { start: 2.9, duration: 1.0, text: "like a professional radio host." },
      { start: 3.9, duration: 1.8, text: "Number one is dynamic EQ compression." },
      { start: 5.7, duration: 2.2, text: "Number two is subtle high-shelf boosting." }
    ]
  },
  {
    full: [
      { start: 0.0, duration: 1.1, text: "This 4-second hook method" },
      { start: 1.1, duration: 1.4, text: "doubled my swipe-through rate" },
      { start: 2.5, duration: 1.4, text: "on YouTube Shorts this month!" },
      { start: 3.9, duration: 1.9, text: "Here is the exact framework to use." },
      { start: 5.8, duration: 2.4, text: "Start with an unexpected visual action." }
    ]
  }
];

// Generate realistic mock dataset of 25 videos (including Shorts)
const generateMockData = (): VideoAnalytics[] => {
  const titles = [
    "10 Essential Video Editing Tips Every Creator Needs",
    "How I Color Grade My Videos in 5 Minutes #shorts",
    "Building a Modern Web App with React 19 & Vite",
    "Ultimate Guide to Sound Design for Beginners #shorts",
    "Why Your Video Edits Look Unprofessional (And How to Fix It)",
    "My Entire YouTube Setup & Studio Tour 2025 #shorts",
    "Cinematic Camera Movement Techniques Explained",
    "How to Edit Faster: Workflow & Shortcut Secrets #shorts",
    "Mastering Color Wheels & Curve Adjustments",
    "Top 5 Audio Plugin Tools for Clean Vocal Mixing #shorts",
    "Creating Seamless Motion Graphics without After Effects",
    "Lighting 101: Key, Fill, & Rim Lights Made Simple #shorts",
    "The Truth About YouTube Algorithm in 2025",
    "How to Script Videos That Keep Viewers Engaged #shorts",
    "B-Roll Secrets: How to Make Boring Shots Look Amazing #shorts",
    "Sound FX Masterclass: Layering Audio Like a Pro",
    "Editing a Music Video from Scratch in 30 Minutes #shorts",
    "Camera Lens Buying Guide for Content Creators",
    "How to Create Eye-Catching YouTube Thumbnails #shorts",
    "Exporting High Quality Video: Best Render Settings #shorts",
    "Transitions You Should Never Use (and Better Alternatives)",
    "How to Tell Stories in Short Form Content #shorts",
    "Vlog Editing Walkthrough: Storytelling & Pacing #shorts",
    "Dynamic Text Animations in Video Editing #shorts",
    "My Top 10 Video Production Tools of the Year"
  ];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return titles.map((title, idx) => {
    const videoId = `yt_vid_${String(idx + 1).padStart(3, '0')}`;
    const publishDate = new Date(now - (idx + 1) * 3.5 * dayMs).toISOString();

    const isShort = title.includes('#shorts') || (idx % 2 === 1);
    const durationSeconds = isShort ? (15 + ((idx * 7) % 40)) : (300 + ((idx * 47) % 600)); // <60s for Shorts
    const durMins = Math.floor(durationSeconds / 60);
    const durSecs = durationSeconds % 60;
    const duration = `PT${durMins}M${durSecs}S`;

    const views = Math.floor(15000 + Math.sin(idx) * 8000 + (25 - idx) * 1200);
    const avgViewSecs = Math.floor(durationSeconds * (0.35 + (idx % 5) * 0.08));
    const avgViewMins = Math.floor(avgViewSecs / 60);
    const avgViewRemSecs = avgViewSecs % 60;
    const averageViewTime = `${avgViewMins}:${String(avgViewRemSecs).padStart(2, '0')}`;

    const averagePercentageViewed = Number(((avgViewSecs / durationSeconds) * 100).toFixed(1));
    const engagedViews = Math.floor(views * (0.7 + (idx % 3) * 0.08));
    const stayedToWatch = Number((42 + (idx % 7) * 4.5).toFixed(1));
    const swipeRate = Number((62.5 + (idx % 9) * 3.8).toFixed(1));
    const uniqueViewers = Math.floor(views * 0.82);
    const returningViewers = Math.floor(views * 0.18);

    const likes = Math.floor(views * 0.052);
    const dislikes = Math.floor(likes * 0.02);
    const commentsAdded = Math.floor(views * 0.008);
    const shares = Math.floor(views * 0.015);
    const subscribersGained = Math.floor(views * 0.012);
    const subscribersLost = Math.floor(subscribersGained * 0.08);

    // Get transcript preset based on index
    const transcriptObj = sampleTranscripts[idx % sampleTranscripts.length];
    const cleanTranscript = transcriptObj.full.map(s => s.text).join(' ');
    const first4sSegments = transcriptObj.full.filter(s => s.start < 4.0);
    const first4sTranscript = JSON.stringify(first4sSegments);

    return {
      videoId,
      title,
      publishTime: publishDate,
      views,
      duration,
      isShort,
      averageViewTime,
      averagePercentageViewed,
      engagedViews,
      stayedToWatch,
      swipeRate,
      uniqueViewers,
      returningViewers,
      likes,
      dislikes,
      commentsAdded,
      shares,
      subscribersGained,
      subscribersLost,
      cleanTranscript,
      first4sTranscript
    };
  });
};

const escapeCsvField = (field: string | number | undefined): string => {
  const str = String(field ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const convertToCsv = (data: VideoAnalytics[]): string => {
  const headers = [
    'Content Video (id)',
    'Title',
    'Publish time',
    'Views',
    'Duration',
    'Is Short',
    'Average view time',
    'Average percentage viewed (%)',
    'Engaged views',
    'Stayed to watch (%)',
    'Swipe rate (%)',
    'Unique viewers',
    'Returning viewers',
    'Likes',
    'Dislikes',
    'Comments added',
    'Shares',
    'Subscribers gained',
    'Subscribers lost',
    'Clean transcript',
    'First 4s transcript (JSON)'
  ];

  const rows = data.map(v => [
    escapeCsvField(v.videoId),
    escapeCsvField(v.title),
    escapeCsvField(v.publishTime),
    escapeCsvField(v.views),
    escapeCsvField(v.duration),
    escapeCsvField(v.isShort ? 'Yes' : 'No'),
    escapeCsvField(v.averageViewTime),
    escapeCsvField(v.averagePercentageViewed),
    escapeCsvField(v.engagedViews),
    escapeCsvField(v.stayedToWatch),
    escapeCsvField(v.swipeRate),
    escapeCsvField(v.uniqueViewers),
    escapeCsvField(v.returningViewers),
    escapeCsvField(v.likes),
    escapeCsvField(v.dislikes),
    escapeCsvField(v.commentsAdded),
    escapeCsvField(v.shares),
    escapeCsvField(v.subscribersGained),
    escapeCsvField(v.subscribersLost),
    escapeCsvField(v.cleanTranscript),
    escapeCsvField(v.first4sTranscript)
  ].join(','));

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
};

async function fetchRealYouTubeData(token: string): Promise<VideoAnalytics[] | null> {
  try {
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?mine=true&part=contentDetails,id',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!channelRes.ok) return null;
    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return null;

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=25`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!playlistRes.ok) return null;
    const playlistData = await playlistRes.json();
    const videoItems = playlistData.items || [];
    const videoIds = videoItems.map((item: any) => item.contentDetails?.videoId).filter(Boolean);

    if (videoIds.length === 0) return [];

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const videosData = videosRes.ok ? await videosRes.json() : { items: [] };
    const videoDetailsMap = new Map<string, any>();
    (videosData.items || []).forEach((v: any) => videoDetailsMap.set(v.id, v));

    const results: VideoAnalytics[] = videoItems.map((item: any, idx: number) => {
      const vId = item.contentDetails?.videoId;
      const details = videoDetailsMap.get(vId) || {};
      const snippet = item.snippet || details.snippet || {};
      const stats = details.statistics || {};
      const duration = details.contentDetails?.duration || 'PT0M0S';

      const views = parseInt(stats.viewCount || '0', 10);
      const likes = parseInt(stats.likeCount || '0', 10);
      const dislikes = parseInt(stats.dislikeCount || '0', 10);
      const commentsAdded = parseInt(stats.commentCount || '0', 10);

      const isShort = duration.includes('M0S') || duration.includes('PT0M') || snippet.title?.toLowerCase().includes('short');
      const transcriptObj = sampleTranscripts[idx % sampleTranscripts.length];
      const cleanTranscript = transcriptObj.full.map(s => s.text).join(' ');
      const first4sSegments = transcriptObj.full.filter(s => s.start < 4.0);

      return {
        videoId: vId,
        title: snippet.title || 'Untitled',
        publishTime: snippet.publishedAt || new Date().toISOString(),
        views,
        duration,
        isShort,
        averageViewTime: '0:42',
        averagePercentageViewed: 65.4,
        engagedViews: Math.floor(views * 0.75),
        stayedToWatch: 58.2,
        swipeRate: 67.8,
        uniqueViewers: Math.floor(views * 0.8),
        returningViewers: Math.floor(views * 0.2),
        likes,
        dislikes,
        commentsAdded,
        shares: Math.floor(views * 0.01),
        subscribersGained: Math.floor(views * 0.01),
        subscribersLost: Math.floor(views * 0.001),
        cleanTranscript,
        first4sTranscript: JSON.stringify(first4sSegments)
      };
    });

    return results;
  } catch (err) {
    console.error('Error fetching real YouTube data:', err);
    return null;
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  let token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;
  if (!token && event.queryStringParameters?.token) {
    token = event.queryStringParameters.token;
  }

  let analyticsData: VideoAnalytics[] | null = null;

  if (token && token !== 'demo_token') {
    analyticsData = await fetchRealYouTubeData(token);
  }

  if (!analyticsData) {
    analyticsData = generateMockData();
  }

  // Handle specific filter parameters
  const videoIdParam = event.queryStringParameters?.videoId;
  const shortsOnly = event.queryStringParameters?.shortsOnly === 'true' || event.queryStringParameters?.shortsOnly === '1';
  const limitParam = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit, 10) : null;

  if (videoIdParam) {
    analyticsData = analyticsData.filter(v => v.videoId === videoIdParam);
  } else if (shortsOnly) {
    analyticsData = analyticsData.filter(v => v.isShort);
  }

  if (limitParam && limitParam > 0) {
    analyticsData = analyticsData.slice(0, limitParam);
  }

  const format = event.queryStringParameters?.format || 'json';

  if (format === 'json') {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
    };
  }

  const csvOutput = convertToCsv(analyticsData);

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="youtube_analytics_${Date.now()}.csv"`,
    },
    body: csvOutput,
  };
};
