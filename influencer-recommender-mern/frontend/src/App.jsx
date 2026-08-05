import { useEffect, useMemo, useState } from 'react';

const defaultForm = {
  niche: 'Fitness',
  country: '',
  budget: 2000,
  goal: 'engagement',
  brandBrief: 'natural skincare and wellness brand for modern women',
  minEngagement: 0,
  topN: 10
};

function App() {
  const [form, setForm] = useState(defaultForm);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [datasetSize, setDatasetSize] = useState(null);
  const [nicheCount, setNicheCount] = useState(null);
  const [niches, setNiches] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      try {
        const [healthResponse, nichesResponse] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/niches')
        ]);

        const health = await healthResponse.json();
        const nicheData = await nichesResponse.json();

        if (!cancelled) {
          setDatasetSize(health.datasetSize);
          setNicheCount(health.nicheCount ?? null);
          setNiches(nicheData.niches || []);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to connect to the backend. Start the Express server first.');
        }
      }
    }

    loadMeta();

    return () => {
      cancelled = true;
    };
  }, []);

  const metricCards = useMemo(() => ([
    { label: 'Dataset size', value: datasetSize ?? '...' },
    { label: 'Available niches', value: nicheCount ?? '...' },
    { label: 'Default niche', value: form.niche },
    { label: 'Goal', value: form.goal }
  ]), [datasetSize, nicheCount, form.niche, form.goal]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          minEngagement: Number(form.minEngagement),
          topN: Number(form.topN)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Request failed');
      }

      setRecommendations(data.recommendations || []);
    } catch (submitError) {
      setError(submitError.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Influencer Recommendation Engine</p>
          <h1>Match brand briefs to creators with a MERN app.</h1>
          <p className="hero-copy">
            Enter a niche, budget, goal, and campaign brief. The backend filters your exported model output and returns a ranked shortlist.
          </p>
        </div>

        <div className="metric-grid">
          {metricCards.map((item) => (
            <article className="metric-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <main className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-header">
            <h2>Brand Profile</h2>
            <p>Use the controls to tailor the shortlist.</p>
          </div>

          <div className="form-grid">
            <label>
              Niche
              <select value={form.niche} onChange={(event) => updateField('niche', event.target.value)}>
                {niches.length > 0 ? niches.map((niche) => (
                  <option key={niche} value={niche}>{niche}</option>
                )) : (
                  <option value="Fitness">Fitness</option>
                )}
              </select>
            </label>

            <label>
              Country
              <input
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
                placeholder="IN, US, GB"
              />
            </label>

            <label>
              Budget per video
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(event) => updateField('budget', event.target.value)}
              />
            </label>

            <label>
              Goal
              <select value={form.goal} onChange={(event) => updateField('goal', event.target.value)}>
                <option value="engagement">Engagement</option>
                <option value="reach">Reach</option>
                <option value="niche">Niche</option>
                <option value="consistent">Consistency</option>
              </select>
            </label>

            <label className="full-span">
              Brand brief
              <textarea
                rows="4"
                value={form.brandBrief}
                onChange={(event) => updateField('brandBrief', event.target.value)}
                placeholder="Describe the product, audience, tone, and campaign angle"
              />
            </label>

            <label>
              Minimum engagement
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.minEngagement}
                onChange={(event) => updateField('minEngagement', event.target.value)}
              />
            </label>

            <label>
              Top results
              <input
                type="number"
                min="1"
                max="50"
                value={form.topN}
                onChange={(event) => updateField('topN', event.target.value)}
              />
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Generate Recommendations'}
          </button>

          {error && <p className="error-text">{error}</p>}
        </form>

        <section className="panel results-panel">
          <div className="panel-header">
            <h2>Ranked Results</h2>
            <p>Sorted by the backend score.</p>
          </div>

          {recommendations.length === 0 ? (
            <div className="empty-state">
              <h3>No results yet</h3>
              <p>Submit the form to view the shortlist.</p>
            </div>
          ) : (
            <div className="results-list">
              {recommendations.map((item) => (
                <article className="result-card" key={`${item.channel_id}-${item.rank}`}>
                  <div className="result-topline">
                    <span className="rank-badge">#{item.rank}</span>
                    <span className={`tier tier-${String(item.influencer_tier || '').toLowerCase()}`}>
                      {item.influencer_tier}
                    </span>
                  </div>

                  <h3>{item.channel_name}</h3>
                  <p className="muted">{item.niche} · {item.country || 'Unknown country'}</p>

                  <div className="stats-row">
                    <span>Subscribers: {Number(item.subscribers).toLocaleString()}</span>
                    <span>Engagement: {Number(item.engagement_rate).toFixed(2)}</span>
                    <span>Score: {Number(item.final_score ?? item.influencer_score).toFixed(4)}</span>
                  </div>

                  <p className="brief">
                    {item.cluster_label || 'Unknown cluster'} · {item.topic_label || 'No topic label'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
