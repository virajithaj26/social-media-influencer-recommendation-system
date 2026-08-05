# Influencer Recommender MERN App

This project wraps the influencer recommendation dataset exported from the notebook into a MERN-style app.

## Structure

- `backend/` - Express API that reads the exported CSV and returns ranked recommendations
- `frontend/` - React app for entering brand criteria and viewing results

## Data

The backend looks for `../../influencers_classified.csv` first, then `../influencers_classified.csv`, then `./data/influencers_classified.csv`.

Because your notebook already exports `influencers_classified.csv` in `C:\Users\pavit\Downloads\Mini Project`, the app can use it immediately if this folder stays inside that directory.

## Run

1. Open `C:\Users\pavit\Downloads\Mini Project\influencer-recommender-mern` in VS Code.
2. Install dependencies:

   ```bash
   npm install
   npm install --workspace backend
   npm install --workspace frontend
   ```

3. Start both apps:

   ```bash
   npm run dev
   ```

4. Open the frontend URL shown by Vite.

## API

- `GET /api/health`
- `POST /api/recommend`

Request body example:

```json
{
  "niche": "Fitness",
  "country": "IN",
  "budget": 2000,
  "goal": "engagement",
  "brandBrief": "natural skincare brand for Indian women",
  "minEngagement": 4,
  "topN": 10
}
```
