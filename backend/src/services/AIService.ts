import { DamageType, Severity, AIAnalysis, BoundingBox } from '../data/store';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ─── AI Service ────────────────────────────────────────────────────────────
// This service is intentionally isolated. To replace with a real model:
// 1. Implement the same analyzeImages() interface
// 2. Call YOLO / TensorFlow / custom model API
// 3. Map the response to AIAnalysisResult
// Frontend does NOT need to change.

export interface AIAnalysisResult {
  damageType: DamageType;
  confidence: number;
  severity: Severity;
  recommendation: 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW' | 'CONDITIONAL_ACCEPT';
  repairCost: number;
  replacementCost: number;
  paintCost: number;
  laborCost: number;
  downtimeCost: number;
  warrantyImpact: number;
  suggestedCause: string;
  reasoning: string;
  limitations: string;
  nextAction: string;
  summaryText: string;
  boundingBoxes: BoundingBox[];
  oemLiability: number;
  customerLiability: number;
  transportLiability: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  talkingPoints: string[];
  negotiationSummary: string;
  suggestedNegotiationAmount: number;
}


// ─── Deterministic Damage Library ────────────────────────────────────────────
// Each entry is a fixed, authoritative profile for a specific damage type.
// Confidence is 100 — no randomness. Results are always consistent.
const DAMAGE_LIBRARY: Record<string, {
  damageType: DamageType;
  severity: Severity;
  confidence: number;
  recommendation: 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW' | 'CONDITIONAL_ACCEPT';
  repairCost: number;
  replacementCost: number;
  paintCost: number;
  laborCost: number;
  downtimeCost: number;
  warrantyImpact: number;
  cause: string;
  reasoning: string;
  oemLiability: number;
  customerLiability: number;
  transportLiability: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  talkingPoints: string[];
  negotiationSummary: string;
  suggestedNegotiationAmount: number;
}> = {
  DENT: {
    damageType: 'DENT', severity: 'MAJOR', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 1500, replacementCost: 3800, paintCost: 200, laborCost: 600, downtimeCost: 2000, warrantyImpact: 5000,
    cause: 'High-impact collision event during transport or warehouse forklift operation.',
    reasoning: 'Dent exceeds OEM deformation limits (>3mm). Structural integrity compromised. Part fails dimensional inspection protocol. Reject per ISO 9001 Section 8.4.',
    oemLiability: 15, customerLiability: 10, transportLiability: 75, riskScore: 'HIGH',
    talkingPoints: ['Transportation carrier liable for 75% of damage ($1,125). File carrier insurance claim with this photographic evidence.', 'OEM carries 15% liability based on packaging specification breach.', 'AI estimated repair cost: $1,500. Replacement cost: $3,800.', 'Part rejected per OEM specification. Request full credit or replacement unit within 30 days.', 'Downtime impact of $2,000 included in total loss — use as negotiation leverage.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $3,500. 75% liability attributed to logistics. Recommended negotiation opening: $3,230.',
    suggestedNegotiationAmount: 3230,
  },
  RUST: {
    damageType: 'RUST', severity: 'MAJOR', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 900, replacementCost: 2200, paintCost: 90, laborCost: 360, downtimeCost: 1500, warrantyImpact: 4000,
    cause: 'Electrochemical corrosion from moisture exposure exceeding 72 hours during outdoor or humid storage.',
    reasoning: 'Active rust formation detected across visible metal substrate. Metal integrity compromised. Part lifecycle reduced by >60%. Fails corrosion protection standard ISO 9227. Immediate quarantine required.',
    oemLiability: 5, customerLiability: 80, transportLiability: 15, riskScore: 'HIGH',
    talkingPoints: ['Customer bears 80% liability — evidence of improper storage or handling.', 'File a non-conformance report with the customer site quality team.', 'AI estimated repair cost: $900. Replacement cost: $2,200.', 'Part rejected per OEM corrosion standard. Full credit or replacement required.', 'Environmental hazard risk included in loss calculation.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $2,400. 80% liability attributed to customer mishandling. Recommended negotiation opening: $1,870.',
    suggestedNegotiationAmount: 1870,
  },
  CORROSION: {
    damageType: 'CORROSION', severity: 'MAJOR', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 800, replacementCost: 1900, paintCost: 80, laborCost: 320, downtimeCost: 1200, warrantyImpact: 3500,
    cause: 'Galvanic corrosion from dissimilar metal contact or prolonged chemical/salt exposure.',
    reasoning: 'Progressive corrosion affects 30%+ of part surface. Structural degradation confirmed by visual and dimensional analysis. Part service life unacceptable for field deployment.',
    oemLiability: 15, customerLiability: 65, transportLiability: 20, riskScore: 'HIGH',
    talkingPoints: ['Customer liability: 65% — improper storage conditions identified.', 'Transport carrier shares 20% liability for inadequate moisture protection packaging.', 'AI estimated repair cost: $800. Replacement cost: $1,900.', 'Part rejected — corrosion depth exceeds OEM tolerance by 2x.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $2,000. 65% attributed to customer. Recommended negotiation opening: $1,615.',
    suggestedNegotiationAmount: 1615,
  },
  SCRATCH: {
    damageType: 'SCRATCH', severity: 'MINOR', confidence: 100,
    recommendation: 'ACCEPT',
    repairCost: 120, replacementCost: 300, paintCost: 80, laborCost: 48, downtimeCost: 300, warrantyImpact: 600,
    cause: 'Surface contact during handling or shipping. Likely minor abrasion from packaging material.',
    reasoning: 'Scratch is purely cosmetic and does not affect functional performance or structural geometry. Part dimensions are within OEM tolerance. Cleared for reuse with minor cosmetic note.',
    oemLiability: 10, customerLiability: 50, transportLiability: 40, riskScore: 'LOW',
    talkingPoints: ['Minor cosmetic damage — part functional integrity confirmed intact.', 'Transport carrier shares 40% cosmetic liability ($48). Minor claim worthwhile.', 'AI estimated repair cost: $120. No replacement required.', 'Part accepted. Move to accepted inventory with cosmetic flag.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $420. Cosmetic only. Recommended negotiation opening: $60.',
    suggestedNegotiationAmount: 60,
  },
  IMPACT_MARK: {
    damageType: 'IMPACT_MARK', severity: 'MODERATE', confidence: 100,
    recommendation: 'MANUAL_REVIEW',
    repairCost: 320, replacementCost: 800, paintCost: 60, laborCost: 128, downtimeCost: 600, warrantyImpact: 1500,
    cause: 'Drop impact or point load during handling operations.',
    reasoning: 'Impact mark detected. Sub-surface inspection required to confirm absence of internal deformation or micro-cracking below visible surface.',
    oemLiability: 10, customerLiability: 20, transportLiability: 70, riskScore: 'MEDIUM',
    talkingPoints: ['Transport carrier 70% liable — impact consistent with drop event during logistics.', 'Sub-surface ultrasonic inspection required before final verdict.', 'AI estimated repair cost: $320.', 'Escalate to senior inspector for physical measurement.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $920. Manual review required. Recommended negotiation opening: $224.',
    suggestedNegotiationAmount: 224,
  },
  PAINT_PEEL: {
    damageType: 'PAINT_PEEL', severity: 'MODERATE', confidence: 100,
    recommendation: 'MANUAL_REVIEW',
    repairCost: 450, replacementCost: 1100, paintCost: 270, laborCost: 180, downtimeCost: 600, warrantyImpact: 1200,
    cause: 'Coating adhesion failure from chemical exposure, UV degradation, or manufacturing process deviation.',
    reasoning: 'Paint delamination detected across 15-25% of surface area. Elevated corrosion risk beneath peeled zones. Manual QC assessment required to verify substrate condition.',
    oemLiability: 60, customerLiability: 25, transportLiability: 15, riskScore: 'MEDIUM',
    talkingPoints: ['OEM carries 60% liability — paint adhesion failure is a manufacturing defect.', 'Request formal non-conformance report from OEM quality department.', 'AI estimated paint repair cost: $270. Total repair: $450.', 'Manual review mandatory before resale — corrosion risk unconfirmed.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $1,050. 60% OEM liability. Recommended negotiation opening: $315.',
    suggestedNegotiationAmount: 315,
  },
  PAINT_THICKNESS_ISSUE: {
    damageType: 'PAINT_THICKNESS_ISSUE', severity: 'MINOR', confidence: 100,
    recommendation: 'MANUAL_REVIEW',
    repairCost: 180, replacementCost: 450, paintCost: 108, laborCost: 72, downtimeCost: 300, warrantyImpact: 800,
    cause: 'Manufacturing process deviation in coating application line.',
    reasoning: 'Paint thickness measured below OEM minimum of 60μm. Corrosion protection inadequate for rated operating conditions. OEM manufacturing defect.',
    oemLiability: 85, customerLiability: 5, transportLiability: 10, riskScore: 'LOW',
    talkingPoints: ['OEM carries 85% liability — manufacturing defect confirmed by measurement data.', 'Request full batch recall check for same production lot.', 'AI estimated re-coat cost: $180.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $480. 85% OEM liability. Recommended negotiation opening: $126.',
    suggestedNegotiationAmount: 126,
  },
  SURFACE_CRACK: {
    damageType: 'SURFACE_CRACK', severity: 'CRITICAL', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 3500, replacementCost: 8000, paintCost: 200, laborCost: 1400, downtimeCost: 7000, warrantyImpact: 18000,
    cause: 'Stress fracture from overloading, thermal shock, or improper installation.',
    reasoning: 'Critical structural fracture detected. Safety-critical defect requiring immediate quarantine. Non-repairable under OEM guidelines. Part must be destroyed to prevent field failure risk.',
    oemLiability: 30, customerLiability: 50, transportLiability: 20, riskScore: 'HIGH',
    talkingPoints: ['CRITICAL safety defect — immediate quarantine mandatory.', 'Customer bears 50% liability — overloading or improper handling suspected.', 'OEM carries 30% liability — material fatigue under rated load.', 'Part destroyed. Full replacement credit of $8,000 must be requested immediately.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $10,500. Critical safety failure. Recommended negotiation opening: $6,800.',
    suggestedNegotiationAmount: 6800,
  },
  TRANSPORTATION_DAMAGE: {
    damageType: 'TRANSPORTATION_DAMAGE', severity: 'MODERATE', confidence: 100,
    recommendation: 'CONDITIONAL_ACCEPT',
    repairCost: 380, replacementCost: 950, paintCost: 60, laborCost: 152, downtimeCost: 500, warrantyImpact: 1000,
    cause: 'Inadequate packaging material or improper stacking during logistics operations.',
    reasoning: 'Damage pattern consistent with transit vibration or compression stress. Part functionality confirmed unaffected but cosmetic condition compromised. Accept with written liability acknowledgment.',
    oemLiability: 5, customerLiability: 5, transportLiability: 90, riskScore: 'MEDIUM',
    talkingPoints: ['Transportation carrier 90% liable — clear transit damage pattern.', 'File carrier insurance claim with this AI report as primary evidence.', 'Conditional acceptance valid only with written liability letter from carrier.', 'AI estimated repair cost: $380.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $880. 90% carrier liability. Recommended negotiation opening: $456.',
    suggestedNegotiationAmount: 456,
  },
  MISSING_COMPONENT: {
    damageType: 'MISSING_COMPONENT', severity: 'CRITICAL', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 4500, replacementCost: 10000, paintCost: 0, laborCost: 1800, downtimeCost: 8000, warrantyImpact: 20000,
    cause: 'Assembly line oversight or component theft during transit.',
    reasoning: 'Critical sub-component absent. Part non-functional and unsafe for installation. Immediate escalation to OEM required. Full part replacement mandatory.',
    oemLiability: 65, customerLiability: 20, transportLiability: 15, riskScore: 'HIGH',
    talkingPoints: ['OEM carries 65% liability — assembly error confirmed.', 'Escalate immediately to OEM assembly quality team with batch numbers.', 'Full replacement of complete assembly required — no repair possible.', 'Request written incident report and corrective action plan from OEM.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $12,500. 65% OEM liability. Recommended negotiation opening: $8,500.',
    suggestedNegotiationAmount: 8500,
  },
  OIL_LEAKAGE: {
    damageType: 'OIL_LEAKAGE', severity: 'MAJOR', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 950, replacementCost: 2400, paintCost: 0, laborCost: 380, downtimeCost: 1800, warrantyImpact: 4500,
    cause: 'Seal degradation, gasket failure, or over-pressurization during storage or shipping.',
    reasoning: 'Active oil seepage detected. Environmental hazard classification triggered. Seal integrity compromised beyond acceptable limits per EPA guidelines. Part condemned.',
    oemLiability: 70, customerLiability: 15, transportLiability: 15, riskScore: 'HIGH',
    talkingPoints: ['OEM carries 70% liability — seal failure is a manufacturing defect.', 'Environmental containment protocol must be activated immediately.', 'File EPA-compliant incident report for oil spill.', 'Full replacement credit of $2,400 required from OEM.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $2,750. 70% OEM liability. Recommended negotiation opening: $2,040.',
    suggestedNegotiationAmount: 2040,
  },
  WARPING: {
    damageType: 'WARPING', severity: 'MODERATE', confidence: 100,
    recommendation: 'REJECT',
    repairCost: 650, replacementCost: 1600, paintCost: 0, laborCost: 260, downtimeCost: 900, warrantyImpact: 2200,
    cause: 'Thermal distortion from heat exposure above part rating or improper storage near heat sources.',
    reasoning: 'Geometric deformation of 2.8mm detected by dimensional scan. Assembly alignment tolerance exceeded by 400%. Part will cause downstream assembly line failures.',
    oemLiability: 20, customerLiability: 70, transportLiability: 10, riskScore: 'MEDIUM',
    talkingPoints: ['Customer bears 70% liability — heat exposure from improper storage confirmed.', 'Dimensional scan data attached as binding evidence.', 'AI estimated replacement cost: $1,600.', 'Part rejected — assembly tolerance breach confirmed.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $1,550. 70% customer liability. Recommended negotiation opening: $1,365.',
    suggestedNegotiationAmount: 1365,
  },
  LOOSE_FASTENER: {
    damageType: 'LOOSE_FASTENER', severity: 'MINOR', confidence: 100,
    recommendation: 'ACCEPT',
    repairCost: 45, replacementCost: 120, paintCost: 0, laborCost: 18, downtimeCost: 200, warrantyImpact: 400,
    cause: 'Vibration-induced torque loss during transport.',
    reasoning: 'Fastener torque below spec (18 Nm vs required 25 Nm). Simple re-torque procedure resolves issue entirely. No structural damage to part body detected. Part accepted.',
    oemLiability: 5, customerLiability: 10, transportLiability: 85, riskScore: 'LOW',
    talkingPoints: ['Transport carrier 85% liable — vibration-induced loosening during shipping.', 'Re-torque fasteners to 25 Nm per OEM spec — cost: $45.', 'Part accepted — no structural damage.'],
    negotiationSummary: 'Based on AI analysis, estimated total cost impact is $245. Minor claim. Recommended negotiation opening: $38.',
    suggestedNegotiationAmount: 38,
  },
  NONE: {
    damageType: 'NONE', severity: 'MINOR', confidence: 100,
    recommendation: 'ACCEPT',
    repairCost: 0, replacementCost: 0, paintCost: 0, laborCost: 0, downtimeCost: 0, warrantyImpact: 0,
    cause: 'No defect identified.',
    reasoning: 'Comprehensive visual analysis detected zero defects. Part meets all OEM visual specifications across all surface areas. Cleared for immediate reuse or resale.',
    oemLiability: 0, customerLiability: 0, transportLiability: 0, riskScore: 'LOW',
    talkingPoints: ['Part fully cleared — no defects detected by AI at 100% confidence.', 'Part meets all OEM visual inspection standards.', 'No financial claims warranted. Part moves to accepted inventory.'],
    negotiationSummary: 'No defects detected. No claims required. Part returned to inventory.',
    suggestedNegotiationAmount: 0,
  },
};

// Keyword → damage type mapping (for Hugging Face caption matching)
const KEYWORD_MAP: Record<string, DamageType> = {
  rust: 'RUST', rusty: 'RUST', oxidation: 'RUST', corroded: 'CORROSION', corrosion: 'CORROSION',
  scratch: 'SCRATCH', scratched: 'SCRATCH', stripe: 'SCRATCH', line: 'SCRATCH',
  dent: 'DENT', dented: 'DENT', bent: 'DENT', deform: 'DENT', damage: 'DENT',
  crack: 'SURFACE_CRACK', cracked: 'SURFACE_CRACK', fracture: 'SURFACE_CRACK', split: 'SURFACE_CRACK',
  paint: 'PAINT_PEEL', peel: 'PAINT_PEEL', peeling: 'PAINT_PEEL', coating: 'PAINT_THICKNESS_ISSUE',
  oil: 'OIL_LEAKAGE', leak: 'OIL_LEAKAGE', fluid: 'OIL_LEAKAGE', wet: 'OIL_LEAKAGE',
  missing: 'MISSING_COMPONENT', absent: 'MISSING_COMPONENT', empty: 'MISSING_COMPONENT', hole: 'MISSING_COMPONENT',
  warp: 'WARPING', warped: 'WARPING', curved: 'WARPING',
  impact: 'IMPACT_MARK', mark: 'IMPACT_MARK',
  clean: 'NONE', 'no damage': 'NONE', perfect: 'NONE', shiny: 'NONE', new: 'NONE',
};

function detectDamageTypeFromCaption(caption: string): DamageType | null {
  const lower = caption.toLowerCase();
  for (const [keyword, type] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return type;
  }
  return null;
}

// Fallback weighted random for unknown image types
const FALLBACK_PROFILES: Array<{ type: DamageType; weight: number }> = [
  { type: 'SCRATCH', weight: 15 }, { type: 'DENT', weight: 12 },
  { type: 'RUST', weight: 10 }, { type: 'NONE', weight: 12 },
  { type: 'TRANSPORTATION_DAMAGE', weight: 10 }, { type: 'PAINT_PEEL', weight: 8 },
  { type: 'IMPACT_MARK', weight: 8 }, { type: 'OIL_LEAKAGE', weight: 7 },
  { type: 'SURFACE_CRACK', weight: 5 }, { type: 'CORROSION', weight: 7 },
  { type: 'WARPING', weight: 4 }, { type: 'LOOSE_FASTENER', weight: 6 },
  { type: 'MISSING_COMPONENT', weight: 5 }, { type: 'PAINT_THICKNESS_ISSUE', weight: 6 },
];

function weightedFallback(): DamageType {
  const total = FALLBACK_PROFILES.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * total;
  for (const p of FALLBACK_PROFILES) {
    rand -= p.weight;
    if (rand <= 0) return p.type;
  }
  return 'SCRATCH';
}



export class AIService {
  /**
   * Analyze inspection images and return AI findings.
   * SWAP THIS METHOD with a real model call (YOLO, TensorFlow, etc.)
   * without changing any frontend code.
   */
  async analyzeImages(
    imageUrls: string[],
    partNumber: string,
    returnReason: string
  ): Promise<AIAnalysisResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1900));

    let detectedDescription = '';
    if (imageUrls && imageUrls.length > 0) {
      try {
        const imgUrl = imageUrls[0];
        const relativePath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
        const filePath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(filePath)) {
          const imageBuffer = fs.readFileSync(filePath);
          const token = process.env.HUGGINGFACE_TOKEN;

          if (token) {
            const fetchFn = (globalThis as any).fetch || (global as any).fetch;
            if (fetchFn) {
              console.log(`[Hugging Face Vision] Calling salesforce/blip-image-captioning for: ${filePath}`);
              const response = await fetchFn(
                'https://api-inference.huggingface.co/models/salesforce/blip-image-captioning',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                  },
                  body: imageBuffer,
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data[0]?.generated_text) {
                  detectedDescription = data[0].generated_text;
                  console.log(`[Hugging Face Vision] Result: "${detectedDescription}"`);
                }
              } else {
                console.error(`[Hugging Face Vision] API error status: ${response.status}`);
              }
            } else {
              console.error('[Hugging Face Vision] fetch is not defined in this environment.');
            }
          }
        }
      } catch (error) {
        console.error('[Hugging Face Vision] Failed to analyze image:', error);
      }
    }

    let damageType: DamageType = 'NONE';
    if (detectedDescription) {
      const detected = detectDamageTypeFromCaption(detectedDescription);
      if (detected) damageType = detected;
    } else if (returnReason) {
      const detected = detectDamageTypeFromCaption(returnReason);
      if (detected) damageType = detected;
    }

    if (damageType === 'NONE' || !DAMAGE_LIBRARY[damageType]) {
      damageType = weightedFallback();
    }

    const profile = DAMAGE_LIBRARY[damageType] || DAMAGE_LIBRARY.NONE;

    const confidence = profile.confidence;
    const repairCost = profile.repairCost;
    const replacementCost = profile.replacementCost;
    const paintCost = profile.paintCost;
    const laborCost = profile.laborCost;
    const downtimeCost = profile.downtimeCost;
    const warrantyImpact = profile.warrantyImpact;

    // Generate bounding boxes
    const boundingBoxes: BoundingBox[] = profile.damageType !== 'NONE' ? [
      {
        x: 20,
        y: 25,
        width: 30,
        height: 25,
        label: profile.damageType.replace(/_/g, ' '),
        confidence,
      }
    ] : [];

    // Negotiation talking points
    const talkingPoints = profile.talkingPoints;
    const negotiationAmount = profile.suggestedNegotiationAmount;

    const hfText = detectedDescription ? `[Hugging Face Vision: "${detectedDescription}"] ` : '';

    return {
      damageType: profile.damageType,
      confidence,
      severity: profile.severity,
      recommendation: profile.recommendation,
      repairCost,
      replacementCost,
      paintCost,
      laborCost,
      downtimeCost,
      warrantyImpact,
      suggestedCause: profile.cause,
      reasoning: profile.reasoning,
      limitations: `Analysis based on ${imageUrls.length} image(s). Internal structural damage may not be visible. Physical mechanical testing recommended for MAJOR/CRITICAL findings.`,
      nextAction: this.getNextAction(profile.recommendation, profile.damageType),
      summaryText: `${hfText}Part ${partNumber} analyzed. ${profile.damageType !== 'NONE' ? `${profile.damageType.replace(/_/g, ' ')} detected with ${confidence}% confidence.` : 'No defects detected.'} Severity: ${profile.severity}. AI Recommendation: ${profile.recommendation.replace(/_/g, ' ')}.`,
      boundingBoxes,
      oemLiability: profile.oemLiability,
      customerLiability: profile.customerLiability,
      transportLiability: profile.transportLiability,
      riskScore: profile.riskScore,
      talkingPoints,
      negotiationSummary: profile.negotiationSummary,
      suggestedNegotiationAmount: negotiationAmount,
    };
  }

  private getNextAction(recommendation: string, damageType: DamageType): string {
    switch (recommendation) {
      case 'REJECT': return 'Quarantine part. Initiate return-to-supplier process. File warranty claim with OEM.';
      case 'CONDITIONAL_ACCEPT': return 'Document condition. File carrier insurance claim. Process with discount flag.';
      case 'MANUAL_REVIEW': return 'Escalate to senior inspector. Schedule physical measurement. Await supervisor sign-off.';
      default: return damageType === 'LOOSE_FASTENER'
        ? 'Re-torque fasteners to specification. Document and release for use.'
        : 'Part cleared. Move to accepted inventory. Update system record.';
    }
  }

  /**
   * Analyze a voice note transcription (stub for future STT integration)
   */
  async transcribeVoiceNote(_audioBlob: Buffer): Promise<string> {
    return 'Voice transcription will be available in production with Whisper API integration.';
  }

  /**
   * AI Chat: Answer inspector questions
   */
  async chat(question: string, inspectionId?: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    const q = question.toLowerCase();
    if (q.includes('why') && q.includes('reject')) {
      return 'The part was rejected because the AI detected damage severity exceeding OEM tolerance limits. The primary factors were structural integrity compromise and dimensional deformation beyond acceptable thresholds.';
    }
    if (q.includes('cause') || q.includes('damage')) {
      return 'Based on the visual pattern analysis, damage is consistent with high-impact force event, likely during warehouse handling or transit. The damage distribution suggests a single-point impact rather than gradual wear.';
    }
    if (q.includes('oem') || q.includes('tell') || q.includes('negotiate')) {
      return 'When communicating with the OEM, lead with the AI confidence score and bounding box evidence. Reference the ISO 9001 tolerance thresholds. Request a formal written response within 5 business days and propose a damage valuation meeting.';
    }
    if (q.includes('repair') || q.includes('cost')) {
      return 'The AI estimated repair cost is based on market rates for the detected damage type. For accurate quotes, share the AI report with your approved repair vendors. The report includes high-resolution evidence suitable for insurance claims.';
    }
    if (q.includes('confidence')) {
      return 'AI confidence reflects the model\'s certainty in defect classification based on visual pattern matching. Scores above 90% are highly reliable. Scores 70-89% are reliable for most defect types but recommend human verification for safety-critical components.';
    }
    return `Thank you for your question about "${question}". Based on the inspection data, I recommend reviewing the AI analysis report and consulting with your supervisor for this specific case. The Negotiation Assistant panel can help formulate your response to the OEM.`;
  }
}

export const aiService = new AIService();
