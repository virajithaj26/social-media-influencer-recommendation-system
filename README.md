# Social Media Influencer Recommendation System

An end-to-end machine learning pipeline that collects, scores, clusters, and
recommends YouTube influencers for brand marketing campaigns — built to help
brands find the right creator partnerships based on niche, budget, and
campaign goals.

## Overview

The system pulls channel data directly from the YouTube Data API, engineers
features that capture influencer quality (not just raw size), scores and
segments influencers fairly *within* their subscriber tier, and layers in NLP
and classification to power a brand-facing recommendation engine.

## Pipeline

1. **Data Collection** — Queried the YouTube Data API v3 across 20 content
   niches (Fitness, Tech, Food, etc.) using multiple search variants per
   niche, with multi-key rotation to handle API quota limits.
2. **Data Cleaning** — Filtered out inactive/low-signal channels (minimum
   subscriber, view, and video-count thresholds), deduplicated on channel ID,
   and standardized inconsistent date formats.
3. **Feature Engineering** — Computed `avg_views_per_video`, a
   log-transformed `engagement_rate`, `account_age_years`, and
   `posting_frequency` from raw channel stats.
4. **Tiering & Scoring** — Bucketed influencers into Nano / Micro / Macro /
   Mega tiers by subscriber count, then computed a weighted
   `influencer_score` using MinMax scaling **within each tier**, so smaller
   creators are ranked fairly against peers their own size rather than
   against mega-influencers.
5. **Clustering** — Ran K-Means within each tier (Micro/Macro/Mega),
   selecting the optimal K via a 3-metric voting system (Silhouette,
   Davies-Bouldin, Calinski-Harabasz), then labeled clusters by behavior
   (e.g. "High Reach", "Niche Creators", "Frequent Posters").
6. **NLP** — Cleaned channel descriptions and applied sentiment analysis
   (TextBlob) and TF-IDF-based keyword extraction.
7. **Classification** — Trained an XGBoost classifier to predict an
   influencer's cluster label from numeric and text-derived features,
   allowing new/unseen channels to be scored without re-running clustering.
8. **Recommendation Engine** — Built a function that filters influencers by
   niche, country, and budget (mapped to affordable tiers), matches campaign
   goals to relevant clusters, and ranks results using a blend of
   `influencer_score` and TF-IDF cosine similarity against a brand's
   free-text campaign brief.

## Tech Stack

Python, pandas, NumPy, scikit-learn (MinMaxScaler, KMeans, TF-IDF, cosine
similarity), XGBoost, SHAP, NLTK, TextBlob, WordCloud, matplotlib, seaborn,
YouTube Data API v3 (`google-api-python-client`)

## Dataset

~4,800 channels collected across 20 niches, reduced to ~2,836 after cleaning
and filtering.

## Example Use Case

> **Input:** Tech brand, $50,000 budget, goal = reach
> **Output:** Top 5 influencers from the "High Reach" / "Mass Reach" clusters
> within the Tech niche, ranked by influencer score.

## Files

- `influencer_selection_system.ipynb` — full pipeline: data collection,
  cleaning, feature engineering, scoring, clustering, NLP, classification,
  and the recommendation engine
