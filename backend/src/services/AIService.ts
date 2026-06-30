import { DamageType, Severity, AIAnalysis, BoundingBox } from '../data/store';
import { v4 as uuidv4 } from 'uuid';

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

const DAMAGE_PROFILES: Array<{
  damageType: DamageType;
  weight: number;
  severity: Severity;
  confidenceRange: [number, number];
  recommendation: AIAnalysisResult['recommendation'];
  repairRange: [number, number];
  cause: string;
  reasoning: string;
  oemLiability: number;
  customerLiability: number;
  transportLiability: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
}> = [
  {
    damageType: 'SCRATCH', weight: 15, severity: 'MINOR',
    confidenceRange: [85, 97], recommendation: 'ACCEPT',
    repairRange: [80, 300],
    cause: 'Surface contact during handling or shipping',
    reasoning: 'Scratch is cosmetic and does not affect functional performance. Part geometry is within OEM tolerance.',
    oemLiability: 10, customerLiability: 50, transportLiability: 40, riskScore: 'LOW'
  },
  {
    damageType: 'DENT', weight: 12, severity: 'MAJOR',
    confidenceRange: [82, 94], recommendation: 'REJECT',
    repairRange: [800, 2000],
    cause: 'High-impact collision event during transport or warehouse handling',
    reasoning: 'Dent exceeds OEM deformation limits (>3mm). Structural integrity compromised. Part fails dimensional inspection protocol.',
    oemLiability: 15, customerLiability: 10, transportLiability: 75, riskScore: 'HIGH'
  },
  {
    damageType: 'PAINT_PEEL', weight: 10, severity: 'MODERATE',
    confidenceRange: [74, 88], recommendation: 'MANUAL_REVIEW',
    repairRange: [300, 700],
    cause: 'Coating adhesion failure from chemical exposure or manufacturing defect',
    reasoning: 'Paint delamination detected across 15-25% surface area. Corrosion risk elevated. Manual assessment required.',
    oemLiability: 60, customerLiability: 25, transportLiability: 15, riskScore: 'MEDIUM'
  },
  {
    damageType: 'RUST', weight: 8, severity: 'MAJOR',
    confidenceRange: [90, 98], recommendation: 'REJECT',
    repairRange: [500, 1500],
    cause: 'Electrochemical corrosion from moisture exposure exceeding 72 hours',
    reasoning: 'Active rust formation detected. Metal substrate compromised. Part lifecycle reduced by >60%. Fails corrosion protection standard ISO 9227.',
    oemLiability: 5, customerLiability: 80, transportLiability: 15, riskScore: 'HIGH'
  },
  {
    damageType: 'SURFACE_CRACK', weight: 8, severity: 'CRITICAL',
    confidenceRange: [93, 99], recommendation: 'REJECT',
    repairRange: [1500, 4000],
    cause: 'Stress fracture from overloading, thermal shock, or improper installation',
    reasoning: 'Critical structural fracture detected. Safety-critical defect requiring immediate quarantine. Non-repairable under OEM guidelines.',
    oemLiability: 30, customerLiability: 50, transportLiability: 20, riskScore: 'HIGH'
  },
  {
    damageType: 'TRANSPORTATION_DAMAGE', weight: 10, severity: 'MODERATE',
    confidenceRange: [80, 92], recommendation: 'CONDITIONAL_ACCEPT',
    repairRange: [200, 600],
    cause: 'Inadequate packaging material or improper stacking during logistics',
    reasoning: 'Damage pattern consistent with transit vibration or compression stress. Part functionality unaffected but aesthetics compromised.',
    oemLiability: 5, customerLiability: 5, transportLiability: 90, riskScore: 'MEDIUM'
  },
  {
    damageType: 'MISSING_COMPONENT', weight: 7, severity: 'CRITICAL',
    confidenceRange: [96, 99], recommendation: 'REJECT',
    repairRange: [2000, 5000],
    cause: 'Assembly line oversight or component theft during transit',
    reasoning: 'Critical sub-component absent. Part non-functional and unsafe for installation. Immediate escalation to OEM required.',
    oemLiability: 65, customerLiability: 20, transportLiability: 15, riskScore: 'HIGH'
  },
  {
    damageType: 'OIL_LEAKAGE', weight: 8, severity: 'MAJOR',
    confidenceRange: [88, 97], recommendation: 'REJECT',
    repairRange: [600, 1800],
    cause: 'Seal degradation, gasket failure, or over-pressurization',
    reasoning: 'Active oil seepage detected. Environmental hazard. Seal integrity compromised beyond acceptable limits per EPA guidelines.',
    oemLiability: 70, customerLiability: 15, transportLiability: 15, riskScore: 'HIGH'
  },
  {
    damageType: 'PAINT_THICKNESS_ISSUE', weight: 6, severity: 'MINOR',
    confidenceRange: [72, 85], recommendation: 'MANUAL_REVIEW',
    repairRange: [150, 400],
    cause: 'Manufacturing process deviation in coating application',
    reasoning: 'Paint thickness measured at 45μm, below OEM minimum of 60μm. Corrosion protection inadequate for rated operating conditions.',
    oemLiability: 85, customerLiability: 5, transportLiability: 10, riskScore: 'LOW'
  },
  {
    damageType: 'CORROSION', weight: 7, severity: 'MAJOR',
    confidenceRange: [87, 96], recommendation: 'REJECT',
    repairRange: [500, 1200],
    cause: 'Galvanic corrosion from dissimilar metal contact or prolonged chemical exposure',
    reasoning: 'Progressive corrosion affects 30%+ of part surface. Structural degradation confirmed. Part service life unacceptable.',
    oemLiability: 15, customerLiability: 65, transportLiability: 20, riskScore: 'HIGH'
  },
  {
    damageType: 'WARPING', weight: 5, severity: 'MODERATE',
    confidenceRange: [78, 91], recommendation: 'REJECT',
    repairRange: [400, 900],
    cause: 'Thermal distortion from heat exposure above part rating or improper storage',
    reasoning: 'Geometric deformation of 2.8mm detected. Assembly alignment tolerance exceeded. Part will cause downstream assembly issues.',
    oemLiability: 20, customerLiability: 70, transportLiability: 10, riskScore: 'MEDIUM'
  },
  {
    damageType: 'LOOSE_FASTENER', weight: 6, severity: 'MINOR',
    confidenceRange: [83, 95], recommendation: 'ACCEPT',
    repairRange: [30, 100],
    cause: 'Vibration-induced torque loss during transport',
    reasoning: 'Fastener torque below spec (18 Nm vs required 25 Nm). Simple re-torque procedure resolves issue. No structural damage detected.',
    oemLiability: 5, customerLiability: 10, transportLiability: 85, riskScore: 'LOW'
  },
  {
    damageType: 'IMPACT_MARK', weight: 8, severity: 'MODERATE',
    confidenceRange: [79, 90], recommendation: 'MANUAL_REVIEW',
    repairRange: [200, 500],
    cause: 'Drop impact or point load during handling operations',
    reasoning: 'Impact mark indicates force event. Sub-surface inspection required to confirm absence of internal deformation or micro-cracking.',
    oemLiability: 10, customerLiability: 20, transportLiability: 70, riskScore: 'MEDIUM'
  },
  {
    damageType: 'NONE', weight: 10, severity: 'MINOR',
    confidenceRange: [94, 99], recommendation: 'ACCEPT',
    repairRange: [0, 0],
    cause: 'No defect identified',
    reasoning: 'Comprehensive visual analysis detected no defects. Part meets all OEM visual specifications. Cleared for reuse or resale.',
    oemLiability: 0, customerLiability: 0, transportLiability: 0, riskScore: 'LOW'
  },
];

function weightedRandom<T>(items: Array<T & { weight: number }>): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

const KEYWORD_MAP: Record<string, string> = {
  rust: 'RUST', rusty: 'RUST', oxidation: 'RUST',
  scratch: 'SCRATCH', scratched: 'SCRATCH',
  dent: 'DENT', dented: 'DENT',
};

function detectDamageTypeFromCaption(caption: string): string | null {
  const lower = caption.toLowerCase();
  for (const [keyword, type] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return type;
  }
  return null;
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
    // Simulate processing time (600ms-2.5s)
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1900));

    const profile = weightedRandom(DAMAGE_PROFILES);
    const confidence = randomInRange(...profile.confidenceRange);
    const repairCost = randomInRange(...profile.repairRange);
    const replacementCost = Math.round(repairCost * (2 + Math.random()));
    const paintCost = profile.damageType.includes('PAINT') ? Math.round(repairCost * 0.6) : Math.round(repairCost * 0.1);
    const laborCost = Math.round(repairCost * (0.3 + Math.random() * 0.3));
    const downtimeCost = profile.severity === 'CRITICAL' ? randomInRange(3000, 8000) :
                         profile.severity === 'MAJOR' ? randomInRange(1000, 3000) : randomInRange(200, 800);
    const warrantyImpact = profile.severity === 'CRITICAL' ? randomInRange(8000, 20000) :
                           profile.severity === 'MAJOR' ? randomInRange(3000, 8000) : randomInRange(500, 2000);

    // Generate bounding boxes
    const boundingBoxes: BoundingBox[] = profile.damageType !== 'NONE' ? [
      {
        x: 15 + Math.random() * 40,
        y: 20 + Math.random() * 30,
        width: 12 + Math.random() * 25,
        height: 8 + Math.random() * 20,
        label: profile.damageType.replace(/_/g, ' '),
        confidence,
      },
      ...(profile.severity === 'MAJOR' || profile.severity === 'CRITICAL' ? [{
        x: 55 + Math.random() * 20,
        y: 50 + Math.random() * 20,
        width: 8 + Math.random() * 12,
        height: 6 + Math.random() * 12,
        label: `${profile.damageType.replace(/_/g, ' ')} (Secondary)`,
        confidence: confidence - randomInRange(5, 15),
      }] : [])
    ] : [];

    // Negotiation talking points
    const talkingPoints = this.generateTalkingPoints(profile, repairCost, replacementCost);
    const negotiationAmount = this.calculateNegotiationAmount(profile, repairCost, replacementCost);

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
      summaryText: `Part ${partNumber} analyzed. ${profile.damageType !== 'NONE' ? `${profile.damageType.replace(/_/g, ' ')} detected with ${confidence}% confidence.` : 'No defects detected.'} Severity: ${profile.severity}. AI Recommendation: ${profile.recommendation.replace(/_/g, ' ')}.`,
      boundingBoxes,
      oemLiability: profile.oemLiability,
      customerLiability: profile.customerLiability,
      transportLiability: profile.transportLiability,
      riskScore: profile.riskScore,
      talkingPoints,
      negotiationSummary: `Based on AI analysis, estimated total cost impact is $${(repairCost + downtimeCost).toLocaleString()}. ${profile.transportLiability}% liability attributed to logistics. Recommended negotiation opening: $${negotiationAmount.toLocaleString()}.`,
      suggestedNegotiationAmount: negotiationAmount,
    };
  }

  private generateTalkingPoints(
    profile: typeof DAMAGE_PROFILES[0],
    repairCost: number,
    replacementCost: number
  ): string[] {
    const points: string[] = [];
    if (profile.oemLiability > 50) {
      points.push(`OEM carries ${profile.oemLiability}% liability based on manufacturing defect indicators.`);
      points.push(`Request full replacement or credit note from ${profile.damageType === 'MISSING_COMPONENT' ? 'OEM assembly team' : 'OEM quality department'}.`);
    }
    if (profile.transportLiability > 50) {
      points.push(`Transportation carrier liable for ${profile.transportLiability}% of damage cost ($${Math.round(repairCost * profile.transportLiability / 100).toLocaleString()}).`);
      points.push('File carrier insurance claim with photographic evidence from this inspection.');
    }
    if (profile.customerLiability > 50) {
      points.push(`Evidence suggests ${profile.customerLiability}% customer liability. Request customer-side root cause analysis.`);
    }
    points.push(`AI-estimated repair cost: $${repairCost.toLocaleString()}. Replacement cost: $${replacementCost.toLocaleString()}.`);
    points.push(`Downtime impact included in total loss calculation. Use as negotiation leverage.`);
    if (profile.recommendation === 'REJECT') {
      points.push('Part rejected per OEM specification. Request full credit or replacement unit within 30 days.');
    } else if (profile.recommendation === 'CONDITIONAL_ACCEPT') {
      points.push('Conditional acceptance valid only with written liability acknowledgment from carrier.');
    }
    return points;
  }

  private calculateNegotiationAmount(
    profile: typeof DAMAGE_PROFILES[0],
    repairCost: number,
    replacementCost: number
  ): number {
    if (profile.recommendation === 'REJECT') return Math.round(replacementCost * 0.85);
    if (profile.recommendation === 'CONDITIONAL_ACCEPT') return Math.round(repairCost * 1.2);
    if (profile.recommendation === 'MANUAL_REVIEW') return Math.round(repairCost * 0.7);
    return Math.round(repairCost * 0.5);
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
