const { v4: uuidv4 } = require('uuid');

/**
 * inspectionController.js - Handles 429 response from AI service
 * When receiving GEMINI_QUOTA_EXHAUSTED:
 * 1. Saves inspection record with note: "AI analysis unavailable — quota exceeded"
 * 2. Returns successful inspection result with recommendation: "manual_review" so app never crashes.
 */
async function handleAnalysisResponse(aiResponse, inspection, req, res) {
  if (aiResponse.status === 429 || aiResponse.error === 'GEMINI_QUOTA_EXHAUSTED') {
    // Save note in inspection record
    const note = {
      id: uuidv4(),
      inspectionId: inspection.id,
      content: 'AI analysis unavailable — quota exceeded',
      authorId: req.user?.userId || inspection.inspectorId || 'system',
      createdAt: new Date(),
    };
    
    if (!inspection.negotiationNotes) inspection.negotiationNotes = [];
    inspection.negotiationNotes.push(note);
    inspection.supervisorNote = 'AI analysis unavailable — quota exceeded';
    inspection.status = 'MANUAL_REVIEW';
    inspection.completedAt = new Date();
    inspection.updatedAt = new Date();

    return res.status(200).json({
      success: true,
      error: 'GEMINI_QUOTA_EXHAUSTED',
      message: 'Gemini API key quota exhausted. Please try again later or contact admin to upgrade the API plan.',
      recommendation: 'manual_review',
      defects: [],
      confidence_score: 0,
      severity: 'unknown',
      fallback: true,
      inspection,
    });
  }

  if (aiResponse.status === 500 || aiResponse.error === 'ANALYSIS_FAILED') {
    const note = {
      id: uuidv4(),
      inspectionId: inspection.id,
      content: 'AI analysis unavailable — analysis error',
      authorId: req.user?.userId || inspection.inspectorId || 'system',
      createdAt: new Date(),
    };

    if (!inspection.negotiationNotes) inspection.negotiationNotes = [];
    inspection.negotiationNotes.push(note);
    inspection.status = 'MANUAL_REVIEW';
    inspection.updatedAt = new Date();

    return res.status(200).json({
      success: true,
      error: 'ANALYSIS_FAILED',
      message: 'Image analysis failed. Please try again.',
      recommendation: 'manual_review',
      defects: [],
      confidence_score: 0,
      severity: 'unknown',
      fallback: true,
      inspection,
    });
  }

  return res.status(200).json({ success: true, inspection, aiAnalysis: aiResponse });
}

module.exports = {
  handleAnalysisResponse,
};
