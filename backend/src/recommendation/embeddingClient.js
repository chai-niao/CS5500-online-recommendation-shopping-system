const EMBEDDING_CONFIG = {
  provider: process.env.EMBEDDING_PROVIDER || 'BAAI',
  model: process.env.EMBEDDING_MODEL || 'BAAI/bge-m3',
  serviceUrl: process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8001',
  enabled: process.env.EMBEDDING_ENABLED === 'true'
};

const getEmbeddingServiceStatus = () => ({ ...EMBEDDING_CONFIG });

const getEmbeddingScoresForUserItems = async (user, items) => {
  if (!EMBEDDING_CONFIG.enabled) {
    return { available: false, reason: 'Embedding service is disabled. Set EMBEDDING_ENABLED=true after BAAI model is ready.', scores: {} };
  }

  try {
    const response = await fetch(`${EMBEDDING_CONFIG.serviceUrl}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBEDDING_CONFIG.model,
        user: {
          id: user.id,
          dietaryPreferences: user.dietaryPreferences || [],
          culturalInterests: user.culturalInterests || []
        },
        items: items.map(i => ({ id: i.id, name: i.name, description: i.description, tags: i.tags || [], normalizedTags: i._normalizedTags || [] }))
      })
    });

    if (!response.ok) {
      return { available: false, reason: `Embedding service responded ${response.status}`, scores: {} };
    }

    const data = await response.json();
    const scoreMap = {};
    (data.scores || []).forEach(row => {
      scoreMap[row.itemId] = row.score;
    });

    return { available: true, reason: 'ok', scores: scoreMap };
  } catch (error) {
    return { available: false, reason: `Embedding service unavailable: ${error.message}`, scores: {} };
  }
};

module.exports = {
  getEmbeddingServiceStatus,
  getEmbeddingScoresForUserItems
};
