import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/store';
import { aiService } from '../services/AIService';

/**
 * Inspection Controller - Handles AI analysis with Gemini Quota Exhaustion & Rate Limiting protection.
 * When GEMINI_QUOTA_EXHAUSTED occurs (429):
 * 1. Saves inspection with note: "AI analysis unavailable — quota exceeded"
 * 2. Returns recommendation: "manual_review" with HTTP 200/429 fallback so app never crashes.
 */
export const analyzeInspection = async (req: Request, res: Response) => {
  const inspectionId = req.params.id || req.body.inspectionId;
  const inspection = db.findInspectionById(inspectionId);

  if (!inspection) {
    return res.status(404).json({ success: false, message: 'Inspection not found' });
  }

  if (!inspection.images || inspection.images.length === 0) {
    return res.status(400).json({ success: false, message: 'Upload at least one image before analyzing' });
  }

  try {
    const imageUrls = inspection.images.map(img => img.url);
    const result = await aiService.analyzeImages(imageUrls, inspection.partNumber, inspection.returnReason);

    const aiAnalysis = {
      id: uuidv4(),
      inspectionId: inspection.id,
      ...result,
      analyzedAt: new Date(),
    };

    inspection.aiAnalysis = aiAnalysis;
    inspection.status =
      result.recommendation === 'ACCEPT' ? 'ACCEPTED' :
      result.recommendation === 'REJECT' ? 'REJECTED' :
      result.recommendation === 'CONDITIONAL_ACCEPT' ? 'ACCEPTED' :
      'MANUAL_REVIEW';
    inspection.completedAt = new Date();
    inspection.inspectionDuration = Math.round((inspection.completedAt.getTime() - inspection.createdAt.getTime()) / 60000);
    inspection.updatedAt = new Date();

    const inspector = db.findUserById(inspection.inspectorId);
    if (inspector) {
      inspector.totalInspections += 1;
      inspector.averageTime = Math.round((inspector.averageTime * (inspector.totalInspections - 1) + (inspection.inspectionDuration ?? 20)) / inspector.totalInspections);
    }

    db.addAuditLog({
      userId: req.user?.userId || inspection.inspectorId,
      action: 'INSPECTION_ANALYZED',
      entityType: 'Inspection',
      entityId: inspection.id,
      metadata: { damageType: result.damageType, confidence: result.confidence, recommendation: result.recommendation },
      ipAddress: req.ip ?? '0.0.0.0',
    });

    return res.json({ success: true, inspection, aiAnalysis });
  } catch (err: any) {
    console.error('AI Analysis Error:', err);

    const isQuotaExhausted =
      err?.error === 'GEMINI_QUOTA_EXHAUSTED' ||
      err?.status === 429 ||
      err?.statusCode === 429 ||
      (err?.message && (
        err.message.toLowerCase().includes('quota') ||
        err.message.toLowerCase().includes('exhausted') ||
        err.message.includes('429') ||
        err.message.toLowerCase().includes('rate limit') ||
        err.message.toLowerCase().includes('resource_exhausted')
      ));

    if (isQuotaExhausted) {
      // Save note in inspection notes field as required
      const quotaNote = {
        id: uuidv4(),
        inspectionId: inspection.id,
        content: 'AI analysis unavailable — quota exceeded',
        authorId: req.user?.userId || inspection.inspectorId || 'system',
        createdAt: new Date(),
      };
      inspection.negotiationNotes.push(quotaNote);
      inspection.supervisorNote = 'AI analysis unavailable — quota exceeded';

      const fallbackAnalysis = {
        id: uuidv4(),
        inspectionId: inspection.id,
        damageType: 'NONE' as const,
        confidence: 0,
        severity: 'MINOR' as const,
        recommendation: 'MANUAL_REVIEW' as const,
        repairCost: 0,
        replacementCost: 0,
        paintCost: 0,
        laborCost: 0,
        downtimeCost: 0,
        warrantyImpact: 0,
        suggestedCause: 'Gemini API key quota exhausted.',
        reasoning: 'Gemini API key quota exhausted. Please try again later or contact admin to upgrade the API plan.',
        limitations: 'AI Service Quota Limit reached.',
        nextAction: 'Escalate to supervisor for manual review.',
        summaryText: 'AI analysis unavailable — quota exceeded. Marked for manual review.',
        boundingBoxes: [],
        oemLiability: 0,
        customerLiability: 0,
        transportLiability: 0,
        riskScore: 'MEDIUM' as const,
        talkingPoints: ['AI Quota Limit Exceeded — Manual Review Required.'],
        negotiationSummary: 'AI analysis unavailable — quota exceeded.',
        suggestedNegotiationAmount: 0,
        analyzedAt: new Date(),
        error: 'GEMINI_QUOTA_EXHAUSTED',
        message: 'Gemini API key quota exhausted. Please try again later or contact admin to upgrade the API plan.',
        fallback: true,
      };

      inspection.aiAnalysis = fallbackAnalysis as any;
      inspection.status = 'MANUAL_REVIEW';
      inspection.completedAt = new Date();
      inspection.updatedAt = new Date();

      // Return successful response with manual_review recommendation so mobile app never crashes
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
        aiAnalysis: fallbackAnalysis,
      });
    }

    // Unexpected error fallback
    const errorNote = {
      id: uuidv4(),
      inspectionId: inspection.id,
      content: 'AI analysis unavailable — analysis error',
      authorId: req.user?.userId || inspection.inspectorId || 'system',
      createdAt: new Date(),
    };
    inspection.negotiationNotes.push(errorNote);
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
};
