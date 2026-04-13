# social-media-influencer-selection-system

A data-driven system to **discover, analyze, score, cluster, and recommend YouTube influencers** based on niche, engagement, reach, and brand goals.

## 🚀 Overview

This project builds a complete pipeline to:

- 📡 Fetch YouTube channel data using YouTube Data API  
- 🧹 Clean and preprocess influencer data  
- 📊 Engineer meaningful features (engagement, posting frequency, etc.)  
- 🏷️ Categorize influencers into tiers (Micro, Macro, Mega)  
- ⭐ Score influencers using a weighted ML-based approach  
- 🧠 Cluster influencers within each tier (KMeans + validation metrics)  
- 🎯 Recommend influencers based on brand requirements  

---
## 🛠️ Tech Stack

- **Python**
- **Pandas, NumPy** → Data processing  
- **Scikit-learn** → Scaling, scoring, clustering  
- **Matplotlib, Seaborn** → Visualization  
- **YouTube Data API v3** → Data collection  

---

## 📂 Project Pipeline

### 1️⃣ Data Collection

- Fetch channels across multiple niches:
  - Fitness, Tech, Food, Travel, Beauty, Finance, Gaming, etc.
- Extract:
  - Subscribers  
  - Views  
  - Videos  
  - Channel metadata  

---

### 2️⃣ Data Preprocessing

- Remove invalid entries:
  - Subscribers < 10K  
  - Views < 50K  
  - Videos < 5  
- Handle missing values  
- Remove duplicates  
- Convert date formats  

---

### 3️⃣ Feature Engineering

New features created:

- **Average Views per Video**
- **Engagement Rate (log transformed)**
- **Account Age (years)**
- **Posting Frequency (videos/year)**

---

### 4️⃣ Influencer Tier Classification

| Tier  | Subscribers |
|------|------------|
| Nano  | <10K |
| Micro | 10K – 100K |
| Macro | 100K – 1M |
| Mega  | 1M+ |

---

### 5️⃣ Influencer Scoring

Weighted scoring formula:

- Engagement Rate → **35%**
- Avg Views → **30%**
- Subscribers → **20%**
- Posting Frequency → **15%**

✔ Log transformation applied  
✔ Scaling done within each tier  

---

### 6️⃣ Clustering (KMeans)

Performed separately for each tier.

**Features used:**
- Subscribers  
- Avg Views  
- Engagement Rate  
- Posting Frequency  

**Cluster validation methods:**
- Silhouette Score  
- Davies-Bouldin Score  
- Calinski-Harabasz Score  

---

### 7️⃣ Cluster Labeling

#### Micro
- 🌱 Rising Stars  
- 🎯 Niche Creators  

#### Macro
- 📢 High Reach  
- 🔁 Frequent Posters  
- 💬 High Engagement  

#### Mega
- 🌍 Mass Reach  
- ⚠️ Low Performers  
- 🔥 Mega Engaged  

---

