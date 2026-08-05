import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { parse } from 'csv-parse/sync';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const NICHE_KEYWORDS = {
  Fitness: [
    'fitness youtube channel',
    'workout youtube channel',
    'gym training channel',
    'home workout channel',
    'bodybuilding youtube channel'
  ],
  Tech: [
    'tech review channel',
    'smartphone review youtube',
    'gadget unboxing channel',
    'programming tutorial channel',
    'AI technology youtube channel'
  ],
  Food: [
    'food youtube channel',
    'cooking youtube channel',
    'street food channel',
    'food review channel',
    'mukbang youtube channel'
  ],
  Travel: [
    'travel vlog channel',
    'solo travel youtube',
    'budget travel channel',
    'luxury travel vlog',
    'travel documentary channel'
  ],
  Beauty: [
    'beauty youtube channel',
    'makeup tutorial channel',
    'skincare youtube channel',
    'beauty review channel',
    'nail art youtube channel'
  ],
  Finance: [
    'finance youtube channel',
    'personal finance channel',
    'stock market youtube',
    'investing youtube channel',
    'cryptocurrency channel'
  ],
  Gaming: [
    'gaming youtube channel',
    'game review channel',
    'esports youtube channel',
    'indie game channel',
    'gaming walkthrough channel'
  ],
  Education: [
    'education youtube channel',
    'online learning channel',
    'science explanation channel',
    'history youtube channel',
    'mathematics tutorial channel'
  ],
  Health: [
    'health wellness youtube channel',
    'mental health youtube',
    'nutrition youtube channel',
    'yoga wellness channel',
    'medical education channel'
  ],
  Fashion: [
    'fashion youtube channel',
    'style lookbook channel',
    'thrift fashion channel',
    'fashion haul youtube',
    'streetwear youtube channel'
  ],
  Music: [
    'music youtube channel',
    'music production channel',
    'guitar tutorial channel',
    'music review youtube',
    'music theory channel'
  ],
  Comedy: [
    'comedy youtube channel',
    'stand up comedy channel',
    'sketch comedy youtube',
    'prank youtube channel',
    'comedy skit channel'
  ],
  Motivation: [
    'motivation youtube channel',
    'self improvement channel',
    'life advice youtube',
    'mindset motivation channel',
    'productivity youtube channel'
  ],
  Cooking: [
    'cooking recipe youtube channel',
    'baking youtube channel',
    'vegan cooking channel',
    'quick recipe channel',
    'professional chef channel'
  ],
  DIY: [
    'DIY youtube channel',
    'home improvement channel',
    'woodworking youtube channel',
    'crafts DIY channel',
    'upcycling youtube channel'
  ],
  Parenting: [
    'parenting youtube channel',
    'mom vlog channel',
    'dad vlog youtube',
    'family youtube channel',
    'baby care youtube channel'
  ],
  Sports: [
    'sports youtube channel',
    'cricket channel india',
    'football analysis channel',
    'basketball youtube channel',
    'sports highlights channel'
  ],
  Photography: [
    'photography youtube channel',
    'camera review channel',
    'photo editing tutorial channel',
    'cinematography youtube',
    'street photography channel'
  ],
  Business: [
    'entrepreneur youtube channel',
    'startup business channel',
    'marketing youtube channel',
    'business strategy channel',
    'ecommerce youtube channel'
  ],
  Spirituality: [
    'meditation youtube channel',
    'yoga spirituality channel',
    'mindfulness youtube channel',
    'spiritual growth channel',
    'astrology youtube channel'
  ]
};

const AVAILABLE_NICHES = Object.keys(NICHE_KEYWORDS);

const GOAL_CLUSTER_MAP = {
  engagement: ['High Engagement', 'Rising Stars', 'Mega Engaged'],
  reach: ['High Reach', 'Mass Reach'],
  niche: ['Niche Creators'],
  consistent: ['Frequent Posters']
};

function getAffordableTiers(budget) {
  if (budget == null || Number.isNaN(Number(budget))) {
    return ['Micro', 'Macro', 'Mega'];
  }
  const amount = Number(budget);
  if (amount < 500) return ['Micro'];
  if (amount < 5000) return ['Micro', 'Macro'];
  return ['Micro', 'Macro', 'Mega'];
}

function readCsvCandidates() {
  const candidates = [
    path.resolve(__dirname, '..', '..', 'influencers_classified.csv'),
    path.resolve(__dirname, '..', 'influencers_classified.csv'),
    path.resolve(__dirname, 'data', 'influencers_classified.csv')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not find influencers_classified.csv. Place it in the project root or backend/data.');
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeString(value) {
  return String(value ?? '').trim();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildSearchHaystack(row) {
  return [
    row.channel_name,
    row.niche,
    row.description,
    row.clean_desc,
    row.topic_label,
    row.cluster_label,
    row.predicted_cluster,
    row.top_keywords
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function applyFilters(rows, { niche, country, budget, goal, minEngagement }, options) {
  let result = [...rows];

  if (options.useNiche && niche) {
    result = result.filter((row) => row.niche.toLowerCase() === String(niche).toLowerCase());
  }

  if (options.useCountry && country) {
    result = result.filter((row) => row.country.toUpperCase() === String(country).toUpperCase());
  }

  if (options.useBudget) {
    const tiers = getAffordableTiers(budget);
    result = result.filter((row) => tiers.includes(row.influencer_tier));
  }

  if (options.useGoal && goal && GOAL_CLUSTER_MAP[String(goal).toLowerCase()]) {
    const preferred = GOAL_CLUSTER_MAP[String(goal).toLowerCase()];
    result = result.filter((row) => preferred.includes(row.cluster_label));
  }

  if (options.useMinEngagement && Number(minEngagement) > 0) {
    result = result.filter((row) => row.engagement_rate >= Number(minEngagement));
  }

  return result;
}

function scoreResults(rows, brandBrief) {
  const brief = String(brandBrief ?? '').toLowerCase().trim();
  const tokens = brief ? brief.split(/[^a-z0-9]+/).filter((token) => token.length > 2) : [];

  return rows.map((row) => {
    const haystack = buildSearchHaystack(row);
    const tokenHits = tokens.reduce((count, token) => count + (haystack.includes(token) ? 1 : 0), 0);
    const keywordHits = String(row.top_keywords ?? '')
      .toLowerCase()
      .split(/[,;|]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .reduce((count, token) => count + (brief.includes(token) ? 1 : 0), 0);

    const nlpSimilarity = tokens.length ? clamp((tokenHits + keywordHits) / (tokens.length + 1), 0, 1) : 0;
    const confidenceBonus = clamp(toNumber(row.cluster_confidence, 0), 0, 1) * 0.05;
    const finalScore = clamp((0.65 * toNumber(row.influencer_score, 0)) + (0.30 * nlpSimilarity) + confidenceBonus, 0, 1);

    return {
      ...row,
      nlp_similarity: Number(nlpSimilarity.toFixed(4)),
      final_score: Number(finalScore.toFixed(4))
    };
  });
}

function loadDataset() {
  const csvPath = readCsvCandidates();
  const raw = fs.readFileSync(csvPath, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((row) => ({
    channel_id: normalizeString(row.channel_id),
    channel_name: normalizeString(row.channel_name),
    niche: normalizeString(row.niche),
    country: normalizeString(row.country),
    description: normalizeString(row.description),
    subscribers: toNumber(row.subscribers),
    total_views: toNumber(row.total_views),
    total_videos: toNumber(row.total_videos),
    avg_views_per_video: toNumber(row.avg_views_per_video),
    engagement_rate: toNumber(row.engagement_rate),
    posting_frequency: toNumber(row.posting_frequency),
    influencer_tier: normalizeString(row.influencer_tier),
    cluster_label: normalizeString(row.cluster_label),
    influencer_score: toNumber(row.influencer_score),
    predicted_cluster: normalizeString(row.predicted_cluster),
    cluster_confidence: toNumber(row.cluster_confidence),
    cluster_mismatch: normalizeString(row.cluster_mismatch),
    clean_desc: normalizeString(row.clean_desc),
    topic_label: normalizeString(row.topic_label),
    sentiment_polarity: toNumber(row.sentiment_polarity),
    sentiment_subjectivity: toNumber(row.sentiment_subjectivity),
    top_keywords: normalizeString(row.top_keywords)
  }));
}

const dataset = loadDataset();

function recommendInfluencers({ niche, country, budget, goal, brandBrief, minEngagement = 0, topN = 10 }) {
  const filterAttempts = [
    { label: 'exact', options: { useNiche: true, useCountry: true, useBudget: true, useGoal: true, useMinEngagement: true } },
    { label: 'without_goal', options: { useNiche: true, useCountry: true, useBudget: true, useGoal: false, useMinEngagement: true } },
    { label: 'without_goal_and_budget', options: { useNiche: true, useCountry: true, useBudget: false, useGoal: false, useMinEngagement: true } },
    { label: 'without_niche_goal_budget', options: { useNiche: false, useCountry: true, useBudget: false, useGoal: false, useMinEngagement: true } },
    { label: 'without_country_niche_goal_budget', options: { useNiche: false, useCountry: false, useBudget: false, useGoal: false, useMinEngagement: true } },
    { label: 'fallback_all', options: { useNiche: false, useCountry: false, useBudget: false, useGoal: false, useMinEngagement: false } }
  ];

  let result = [];

  for (const attempt of filterAttempts) {
    result = applyFilters(dataset, { niche, country, budget, goal, minEngagement }, attempt.options);

    if (result.length > 0) {
      break;
    }
  }

  result = scoreResults(result, brandBrief);

  return result
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, Number(topN) || 10)
    .map((row, index) => ({
      rank: index + 1,
      ...row
    }));
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    datasetSize: dataset.length,
    nicheCount: AVAILABLE_NICHES.length
  });
});

app.get('/api/niches', (_req, res) => {
  res.json({ niches: AVAILABLE_NICHES });
});

app.post('/api/recommend', (req, res) => {
  try {
    const { niche, country, budget, goal, brandBrief, minEngagement, topN } = req.body ?? {};
    const recommendations = recommendInfluencers({
      niche,
      country,
      budget,
      goal,
      brandBrief,
      minEngagement,
      topN
    });

    res.json({
      count: recommendations.length,
      filters: { niche, country, budget, goal, minEngagement, topN },
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
