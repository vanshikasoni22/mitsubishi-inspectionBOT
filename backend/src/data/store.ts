import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// ─── Types ─────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'INSPECTOR' | 'SUPERVISOR';
export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'ACCEPTED' | 'REJECTED' | 'MANUAL_REVIEW';
export type Severity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
export type DamageType =
  | 'SCRATCH' | 'DENT' | 'PAINT_PEEL' | 'PAINT_THICKNESS_ISSUE' | 'RUST'
  | 'SURFACE_CRACK' | 'TRANSPORTATION_DAMAGE' | 'IMPACT_MARK' | 'CORROSION'
  | 'MISSING_COMPONENT' | 'OIL_LEAKAGE' | 'WARPING' | 'LOOSE_FASTENER' | 'NONE';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar?: string;
  department: string;
  phone?: string;
  totalInspections: number;
  averageTime: number; // minutes
  accuracyScore: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface OEM {
  id: string;
  name: string;
  country: string;
  contactEmail: string;
  logoUrl?: string;
  partnerSince: number;
  totalParts: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  rating: number;
  country: string;
  totalDeliveries: number;
  defectRate: number;
}

export interface InspectionImage {
  id: string;
  inspectionId: string;
  url: string;
  filename: string;
  order: number;
  uploadedAt: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface AIAnalysis {
  id: string;
  inspectionId: string;
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
  analyzedAt: Date;
}

export interface Inspection {
  id: string;
  partNumber: string;
  oemId: string;
  supplierId: string;
  vehicleModel: string;
  batchNumber: string;
  returnReason: string;
  status: InspectionStatus;
  inspectorId: string;
  supervisorId?: string;
  supervisorNote?: string;
  voiceNoteUrl?: string;
  gpsLocation?: string;
  images: InspectionImage[];
  aiAnalysis?: AIAnalysis;
  negotiationNotes: NegotiationNote[];
  checklist: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  inspectionDuration?: number; // minutes
}

export interface NegotiationNote {
  id: string;
  inspectionId: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  ipAddress: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────
class DataStore {
  users: User[] = [];
  oems: OEM[] = [];
  suppliers: Supplier[] = [];
  inspections: Inspection[] = [];
  auditLogs: AuditLog[] = [];
  notifications: Notification[] = [];
  refreshTokens: Set<string> = new Set();

  constructor() {
    this.seed();
  }

  private async seed() {
    this.seedOEMs();
    this.seedSuppliers();
    await this.seedUsers();
    this.seedInspections();
    this.seedAuditLogs();
    this.seedNotifications();
  }

  private seedOEMs() {
    const oemData = [
      { name: 'Bosch Automotive', country: 'Germany', contactEmail: 'parts@bosch-auto.com', partnerSince: 2018 },
      { name: 'Continental AG', country: 'Germany', contactEmail: 'returns@continental.com', partnerSince: 2019 },
      { name: 'Denso Corporation', country: 'Japan', contactEmail: 'inspection@denso.com', partnerSince: 2017 },
      { name: 'Magna International', country: 'Canada', contactEmail: 'quality@magna.com', partnerSince: 2020 },
      { name: 'ZF Friedrichshafen', country: 'Germany', contactEmail: 'returns@zf.com', partnerSince: 2018 },
      { name: 'Aisin Group', country: 'Japan', contactEmail: 'parts@aisin.com', partnerSince: 2021 },
      { name: 'Aptiv PLC', country: 'Ireland', contactEmail: 'qa@aptiv.com', partnerSince: 2019 },
      { name: 'Valeo SA', country: 'France', contactEmail: 'inspection@valeo.com', partnerSince: 2020 },
      { name: 'Delphi Technologies', country: 'UK', contactEmail: 'returns@delphi.com', partnerSince: 2016 },
      { name: 'BorgWarner', country: 'USA', contactEmail: 'quality@borgwarner.com', partnerSince: 2022 },
    ];
    this.oems = oemData.map((o, i) => ({
      id: uuidv4(),
      ...o,
      totalParts: 5000 + i * 1200,
    }));
  }

  private seedSuppliers() {
    const supplierData = [
      { name: 'AutoParts Direct', country: 'USA', rating: 4.7, defectRate: 1.2 },
      { name: 'EuroParts GmbH', country: 'Germany', rating: 4.5, defectRate: 1.8 },
      { name: 'Asia Auto Supply', country: 'China', rating: 4.2, defectRate: 2.3 },
      { name: 'PrecisionMotors Ltd', country: 'UK', rating: 4.8, defectRate: 0.9 },
      { name: 'Nordic Components', country: 'Sweden', rating: 4.6, defectRate: 1.1 },
      { name: 'Trans-Pacific Parts', country: 'Japan', rating: 4.9, defectRate: 0.7 },
      { name: 'MexiParts S.A.', country: 'Mexico', rating: 4.1, defectRate: 2.7 },
      { name: 'IndoAuto Components', country: 'India', rating: 3.9, defectRate: 3.1 },
      { name: 'BrazilParts Ltda', country: 'Brazil', rating: 4.0, defectRate: 2.9 },
      { name: 'KoreanPrecision', country: 'South Korea', rating: 4.7, defectRate: 1.0 },
    ];
    this.suppliers = supplierData.map((s, i) => ({
      id: uuidv4(),
      ...s,
      contactEmail: `contact@${s.name.toLowerCase().replace(/\s+/g, '')}.com`,
      totalDeliveries: 800 + i * 200,
    }));
  }

  private async seedUsers() {
    const hash = (pw: string) => bcrypt.hashSync(pw, 10);
    const users: Omit<User, 'passwordHash'>[] = [
      // Admins
      { id: uuidv4(), name: 'Sarah Mitchell', email: 'admin@autoinspect.ai', role: 'ADMIN', department: 'Management', phone: '+1-555-0100', totalInspections: 0, averageTime: 0, accuracyScore: 100, badges: ['ADMIN', 'FOUNDER'], createdAt: new Date('2024-01-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Marcus Wei', email: 'marcus@autoinspect.ai', role: 'ADMIN', department: 'IT', phone: '+1-555-0101', totalInspections: 0, averageTime: 0, accuracyScore: 100, badges: ['ADMIN'], createdAt: new Date('2024-01-15'), updatedAt: new Date(), isActive: true },
      // Supervisors
      { id: uuidv4(), name: 'Elena Kovacs', email: 'elena.kovacs@autoinspect.ai', role: 'SUPERVISOR', department: 'Quality Control', phone: '+1-555-0102', totalInspections: 120, averageTime: 18, accuracyScore: 97, badges: ['SUPERVISOR', 'GOLD_STAR'], createdAt: new Date('2024-02-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'James Thornton', email: 'j.thornton@autoinspect.ai', role: 'SUPERVISOR', department: 'Quality Control', phone: '+1-555-0103', totalInspections: 98, averageTime: 21, accuracyScore: 95, badges: ['SUPERVISOR'], createdAt: new Date('2024-02-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Priya Sharma', email: 'p.sharma@autoinspect.ai', role: 'SUPERVISOR', department: 'Returns', phone: '+1-555-0104', totalInspections: 145, averageTime: 16, accuracyScore: 98, badges: ['SUPERVISOR', 'TOP_PERFORMER'], createdAt: new Date('2024-03-01'), updatedAt: new Date(), isActive: true },
      // Inspectors (15)
      { id: uuidv4(), name: 'Ahmed Hassan', email: 'a.hassan@autoinspect.ai', role: 'INSPECTOR', department: 'Line A', phone: '+1-555-0105', totalInspections: 234, averageTime: 14, accuracyScore: 94, badges: ['INSPECTOR', 'SPEED_DEMON', 'GOLD_STAR'], createdAt: new Date('2024-03-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Mei Lin', email: 'm.lin@autoinspect.ai', role: 'INSPECTOR', department: 'Line B', phone: '+1-555-0106', totalInspections: 198, averageTime: 17, accuracyScore: 96, badges: ['INSPECTOR', 'PRECISION'], createdAt: new Date('2024-03-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Carlos Ruiz', email: 'c.ruiz@autoinspect.ai', role: 'INSPECTOR', department: 'Line A', phone: '+1-555-0107', totalInspections: 176, averageTime: 19, accuracyScore: 92, badges: ['INSPECTOR'], createdAt: new Date('2024-04-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Anna Petrov', email: 'a.petrov@autoinspect.ai', role: 'INSPECTOR', department: 'Line C', phone: '+1-555-0108', totalInspections: 212, averageTime: 15, accuracyScore: 95, badges: ['INSPECTOR', 'ACCURACY_ACE'], createdAt: new Date('2024-04-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'David Okonkwo', email: 'd.okonkwo@autoinspect.ai', role: 'INSPECTOR', department: 'Line B', phone: '+1-555-0109', totalInspections: 267, averageTime: 12, accuracyScore: 93, badges: ['INSPECTOR', 'CENTURY_CLUB', 'SPEED_DEMON'], createdAt: new Date('2024-04-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Lisa Nakamura', email: 'l.nakamura@autoinspect.ai', role: 'INSPECTOR', department: 'Line C', phone: '+1-555-0110', totalInspections: 155, averageTime: 20, accuracyScore: 97, badges: ['INSPECTOR', 'PRECISION'], createdAt: new Date('2024-05-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Felix Bauer', email: 'f.bauer@autoinspect.ai', role: 'INSPECTOR', department: 'Line A', phone: '+1-555-0111', totalInspections: 189, averageTime: 16, accuracyScore: 91, badges: ['INSPECTOR'], createdAt: new Date('2024-05-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Sofia Mendez', email: 's.mendez@autoinspect.ai', role: 'INSPECTOR', department: 'Line D', phone: '+1-555-0112', totalInspections: 143, averageTime: 22, accuracyScore: 89, badges: ['INSPECTOR'], createdAt: new Date('2024-06-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Ravi Patel', email: 'r.patel@autoinspect.ai', role: 'INSPECTOR', department: 'Line D', phone: '+1-555-0113', totalInspections: 223, averageTime: 13, accuracyScore: 94, badges: ['INSPECTOR', 'SPEED_DEMON'], createdAt: new Date('2024-06-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Ingrid Larsen', email: 'i.larsen@autoinspect.ai', role: 'INSPECTOR', department: 'Line B', phone: '+1-555-0114', totalInspections: 167, averageTime: 18, accuracyScore: 96, badges: ['INSPECTOR', 'ACCURACY_ACE'], createdAt: new Date('2024-07-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Omar Al-Rashid', email: 'o.alrashid@autoinspect.ai', role: 'INSPECTOR', department: 'Line C', phone: '+1-555-0115', totalInspections: 134, averageTime: 24, accuracyScore: 88, badges: ['INSPECTOR'], createdAt: new Date('2024-07-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Yuki Tanaka', email: 'y.tanaka@autoinspect.ai', role: 'INSPECTOR', department: 'Line A', phone: '+1-555-0116', totalInspections: 245, averageTime: 14, accuracyScore: 95, badges: ['INSPECTOR', 'CENTURY_CLUB'], createdAt: new Date('2024-08-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Grace Osei', email: 'g.osei@autoinspect.ai', role: 'INSPECTOR', department: 'Line D', phone: '+1-555-0117', totalInspections: 178, averageTime: 17, accuracyScore: 93, badges: ['INSPECTOR'], createdAt: new Date('2024-08-15'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Test Inspector', email: 'inspector@autoinspect.ai', role: 'INSPECTOR', department: 'Line A', phone: '+1-555-0199', totalInspections: 50, averageTime: 20, accuracyScore: 90, badges: ['INSPECTOR'], createdAt: new Date('2024-01-01'), updatedAt: new Date(), isActive: true },
      { id: uuidv4(), name: 'Test Supervisor', email: 'supervisor@autoinspect.ai', role: 'SUPERVISOR', department: 'Quality Control', phone: '+1-555-0198', totalInspections: 80, averageTime: 18, accuracyScore: 95, badges: ['SUPERVISOR'], createdAt: new Date('2024-01-01'), updatedAt: new Date(), isActive: true },
    ];

    const passwords: Record<string, string> = {
      'admin@autoinspect.ai': 'Admin@123',
      'inspector@autoinspect.ai': 'Inspector@123',
      'supervisor@autoinspect.ai': 'Supervisor@123',
    };

    this.users = users.map(u => ({
      ...u,
      passwordHash: hash(passwords[u.email] ?? 'AutoInspect@2024'),
    }));
  }

  private seedInspections() {
    const damageScenarios: Array<{
      damageType: DamageType; severity: Severity; confidence: number;
      recommendation: AIAnalysis['recommendation'];
      repairCost: number; suggestedCause: string; reasoning: string;
      oemLiability: number; customerLiability: number; transportLiability: number;
      riskScore: AIAnalysis['riskScore'];
    }> = [
      { damageType: 'SCRATCH', severity: 'MINOR', confidence: 92, recommendation: 'ACCEPT', repairCost: 150, suggestedCause: 'Minor handling during shipping', reasoning: 'Surface-level scratch does not affect functionality. Part meets OEM specification thresholds.', oemLiability: 10, customerLiability: 60, transportLiability: 30, riskScore: 'LOW' },
      { damageType: 'DENT', severity: 'MAJOR', confidence: 88, recommendation: 'REJECT', repairCost: 1200, suggestedCause: 'Impact during warehouse handling or forklift collision', reasoning: 'Dent affects structural integrity and part geometry. Fails OEM dimensional tolerance test.', oemLiability: 20, customerLiability: 10, transportLiability: 70, riskScore: 'HIGH' },
      { damageType: 'PAINT_PEEL', severity: 'MODERATE', confidence: 79, recommendation: 'MANUAL_REVIEW', repairCost: 450, suggestedCause: 'Chemical exposure or UV degradation', reasoning: 'Paint peeling indicates coating failure. Moderate severity requires supervisor assessment.', oemLiability: 50, customerLiability: 30, transportLiability: 20, riskScore: 'MEDIUM' },
      { damageType: 'RUST', severity: 'MAJOR', confidence: 96, recommendation: 'REJECT', repairCost: 800, suggestedCause: 'Prolonged moisture exposure, likely improper storage', reasoning: 'Rust formation indicates metal corrosion compromising part integrity and longevity.', oemLiability: 5, customerLiability: 75, transportLiability: 20, riskScore: 'HIGH' },
      { damageType: 'SURFACE_CRACK', severity: 'CRITICAL', confidence: 98, recommendation: 'REJECT', repairCost: 2500, suggestedCause: 'Stress fracture from overloading or improper installation', reasoning: 'Surface crack is a safety-critical defect. Immediate rejection required per ISO 9001.', oemLiability: 30, customerLiability: 50, transportLiability: 20, riskScore: 'HIGH' },
      { damageType: 'TRANSPORTATION_DAMAGE', severity: 'MODERATE', confidence: 85, recommendation: 'CONDITIONAL_ACCEPT', repairCost: 350, suggestedCause: 'Inadequate packaging during transport', reasoning: 'Damage occurred post-manufacturing. Conditional acceptance subject to carrier insurance claim.', oemLiability: 10, customerLiability: 5, transportLiability: 85, riskScore: 'MEDIUM' },
      { damageType: 'MISSING_COMPONENT', severity: 'CRITICAL', confidence: 99, recommendation: 'REJECT', repairCost: 3000, suggestedCause: 'Assembly error or theft during transit', reasoning: 'Missing critical sub-component makes part non-functional and unsafe.', oemLiability: 60, customerLiability: 20, transportLiability: 20, riskScore: 'HIGH' },
      { damageType: 'OIL_LEAKAGE', severity: 'MAJOR', confidence: 94, recommendation: 'REJECT', repairCost: 900, suggestedCause: 'Seal failure or gasket degradation', reasoning: 'Oil leakage presents environmental hazard and indicates seal failure requiring full replacement.', oemLiability: 70, customerLiability: 20, transportLiability: 10, riskScore: 'HIGH' },
      { damageType: 'PAINT_THICKNESS_ISSUE', severity: 'MINOR', confidence: 76, recommendation: 'MANUAL_REVIEW', repairCost: 200, suggestedCause: 'Manufacturing process deviation', reasoning: 'Paint thickness below OEM specification minimum. May affect corrosion protection.', oemLiability: 80, customerLiability: 10, transportLiability: 10, riskScore: 'LOW' },
      { damageType: 'CORROSION', severity: 'MAJOR', confidence: 91, recommendation: 'REJECT', repairCost: 750, suggestedCause: 'Electrochemical reaction from incompatible material contact', reasoning: 'Advanced corrosion compromises structural integrity. Part lifecycle significantly reduced.', oemLiability: 15, customerLiability: 65, transportLiability: 20, riskScore: 'HIGH' },
      { damageType: 'WARPING', severity: 'MODERATE', confidence: 83, recommendation: 'REJECT', repairCost: 600, suggestedCause: 'Heat exposure above rated temperature limit', reasoning: 'Geometric deformation causes misalignment during assembly. Part out of tolerance specification.', oemLiability: 20, customerLiability: 70, transportLiability: 10, riskScore: 'MEDIUM' },
      { damageType: 'LOOSE_FASTENER', severity: 'MINOR', confidence: 87, recommendation: 'ACCEPT', repairCost: 50, suggestedCause: 'Vibration during transport loosened fastener torque', reasoning: 'Fastener can be re-torqued to specification. No structural damage to part detected.', oemLiability: 5, customerLiability: 15, transportLiability: 80, riskScore: 'LOW' },
      { damageType: 'IMPACT_MARK', severity: 'MODERATE', confidence: 82, recommendation: 'MANUAL_REVIEW', repairCost: 300, suggestedCause: 'Drop impact or collision during handling', reasoning: 'Impact marks present. Sub-surface assessment required to rule out internal deformation.', oemLiability: 10, customerLiability: 20, transportLiability: 70, riskScore: 'MEDIUM' },
      { damageType: 'NONE', severity: 'MINOR', confidence: 97, recommendation: 'ACCEPT', repairCost: 0, suggestedCause: 'No defect detected', reasoning: 'Part meets all OEM specifications. No visual defects detected. Ready for reuse.', oemLiability: 0, customerLiability: 0, transportLiability: 0, riskScore: 'LOW' },
    ];

    const returnReasons = [
      'Customer Complaint - Cosmetic Damage',
      'Assembly Line Rejection - Dimensional',
      'Warranty Claim - Premature Failure',
      'Incoming Quality Control Rejection',
      'Transport Damage Claim',
      'Wrong Part Delivered',
      'Batch Recall',
      'End of Life Return',
      'Quality Audit Finding',
      'Customer Change of Mind',
    ];

    const vehicleModels = [
      'BMW 5 Series 2023', 'Mercedes C-Class 2024', 'Audi A4 2023',
      'Toyota Camry 2024', 'Ford F-150 2023', 'Honda Accord 2024',
      'Volkswagen Golf 2023', 'Hyundai Sonata 2024', 'Kia EV6 2023',
      'Tesla Model 3 2024', 'Volvo XC90 2023', 'BMW iX 2024',
    ];

    const partNumbers = [
      'ENG-45678-A', 'BRK-12345-B', 'TRN-98765-C', 'EXH-23456-D',
      'SUS-34567-E', 'ELC-45678-F', 'FUE-56789-G', 'AIR-67890-H',
      'COO-78901-I', 'STR-89012-J', 'DRV-90123-K', 'IGN-01234-L',
    ];

    const inspectors = this.users.filter(u => u.role === 'INSPECTOR');
    const supervisors = this.users.filter(u => u.role === 'SUPERVISOR');

    // Generate 50 inspections over the last 6 months
    for (let i = 0; i < 50; i++) {
      const scenario = damageScenarios[i % damageScenarios.length];
      const inspector = inspectors[i % inspectors.length];
      const supervisor = supervisors[i % supervisors.length];
      const oem = this.oems[i % this.oems.length];
      const supplier = this.suppliers[i % this.suppliers.length];
      const daysAgo = Math.floor(Math.random() * 180);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      const inspectionId = uuidv4();
      const duration = 10 + Math.floor(Math.random() * 30);
      const completedAt = new Date(createdAt.getTime() + duration * 60000);

      const status: InspectionStatus =
        scenario.recommendation === 'ACCEPT' ? 'ACCEPTED' :
        scenario.recommendation === 'REJECT' ? 'REJECTED' :
        scenario.recommendation === 'MANUAL_REVIEW' ? 'MANUAL_REVIEW' :
        'ACCEPTED';

      const repCost = scenario.repairCost;
      const replCost = repCost * 2.5;
      const paintCost = scenario.damageType.includes('PAINT') ? repCost * 0.6 : repCost * 0.1;
      const laborCost = repCost * 0.4;
      const downtimeCost = scenario.severity === 'CRITICAL' ? 5000 : scenario.severity === 'MAJOR' ? 2000 : 500;

      const aiAnalysis: AIAnalysis = {
        id: uuidv4(),
        inspectionId,
        damageType: scenario.damageType,
        confidence: scenario.confidence,
        severity: scenario.severity,
        recommendation: scenario.recommendation,
        repairCost: repCost,
        replacementCost: replCost,
        paintCost,
        laborCost,
        downtimeCost,
        warrantyImpact: scenario.severity === 'CRITICAL' ? 12000 : scenario.severity === 'MAJOR' ? 5000 : 1000,
        suggestedCause: scenario.suggestedCause,
        reasoning: scenario.reasoning,
        limitations: 'AI analysis based on visual inspection only. Internal structural assessment requires physical testing.',
        nextAction: scenario.recommendation === 'REJECT' ? 'Initiate return-to-supplier process' :
                    scenario.recommendation === 'MANUAL_REVIEW' ? 'Escalate to senior inspector' :
                    scenario.recommendation === 'CONDITIONAL_ACCEPT' ? 'File carrier insurance claim' :
                    'Process for reuse or resale',
        summaryText: `Inspection of part ${partNumbers[i % partNumbers.length]} completed. AI detected ${scenario.damageType.replace(/_/g, ' ')} with ${scenario.confidence}% confidence. Severity classified as ${scenario.severity}. Recommendation: ${scenario.recommendation.replace(/_/g, ' ')}.`,
        boundingBoxes: scenario.damageType !== 'NONE' ? [
          { x: 20 + Math.random() * 30, y: 20 + Math.random() * 30, width: 15 + Math.random() * 20, height: 10 + Math.random() * 15, label: scenario.damageType.replace(/_/g, ' '), confidence: scenario.confidence },
          ...(scenario.severity === 'MAJOR' || scenario.severity === 'CRITICAL' ? [
            { x: 55 + Math.random() * 20, y: 40 + Math.random() * 20, width: 10 + Math.random() * 10, height: 8 + Math.random() * 10, label: `${scenario.damageType.replace(/_/g, ' ')} (Secondary)`, confidence: scenario.confidence - 10 }
          ] : [])
        ] : [],
        oemLiability: scenario.oemLiability,
        customerLiability: scenario.customerLiability,
        transportLiability: scenario.transportLiability,
        riskScore: scenario.riskScore,
        analyzedAt: new Date(completedAt.getTime() + 30000),
      };

      const inspection: Inspection = {
        id: inspectionId,
        partNumber: partNumbers[i % partNumbers.length],
        oemId: oem.id,
        supplierId: supplier.id,
        vehicleModel: vehicleModels[i % vehicleModels.length],
        batchNumber: `BATCH-${2024}-${String(i + 1).padStart(4, '0')}`,
        returnReason: returnReasons[i % returnReasons.length],
        status,
        inspectorId: inspector.id,
        supervisorId: supervisor.id,
        supervisorNote: status === 'MANUAL_REVIEW' ? 'Pending physical verification by QC team.' : undefined,
        images: [],
        aiAnalysis,
        negotiationNotes: [
          {
            id: uuidv4(),
            inspectionId,
            content: `Initial assessment: ${scenario.reasoning}. Liability discussion pending with ${oem.name}.`,
            authorId: inspector.id,
            createdAt: completedAt,
          }
        ],
        checklist: [
          { id: uuidv4(), label: 'Part number verified', checked: true },
          { id: uuidv4(), label: 'Serial number recorded', checked: true },
          { id: uuidv4(), label: 'Packaging condition noted', checked: true },
          { id: uuidv4(), label: 'Multiple photos captured', checked: true },
          { id: uuidv4(), label: 'Barcode scanned', checked: Math.random() > 0.3 },
          { id: uuidv4(), label: 'OEM specification checked', checked: true },
          { id: uuidv4(), label: 'Damage area measured', checked: scenario.damageType !== 'NONE' },
        ],
        gpsLocation: `${(48 + Math.random() * 5).toFixed(4)},${(8 + Math.random() * 10).toFixed(4)}`,
        createdAt,
        updatedAt: completedAt,
        completedAt,
        inspectionDuration: duration,
      };

      this.inspections.push(inspection);
    }

    // Sort by newest first
    this.inspections.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private seedAuditLogs() {
    const actions = ['LOGIN', 'INSPECTION_CREATED', 'INSPECTION_ANALYZED', 'STATUS_OVERRIDE', 'REPORT_DOWNLOADED', 'USER_UPDATED'];
    const users = this.users;
    for (let i = 0; i < 100; i++) {
      const user = users[i % users.length];
      this.auditLogs.push({
        id: uuidv4(),
        userId: user.id,
        action: actions[i % actions.length],
        entityType: i % 2 === 0 ? 'Inspection' : 'User',
        entityId: this.inspections[i % this.inspections.length]?.id ?? user.id,
        metadata: {},
        createdAt: new Date(Date.now() - i * 3600000),
        ipAddress: `192.168.1.${100 + (i % 50)}`,
      });
    }
  }

  private seedNotifications() {
    const inspectors = this.users.filter(u => u.role === 'INSPECTOR');
    const types = ['INSPECTION_COMPLETED', 'REPORT_GENERATED', 'MANUAL_REVIEW_REQUIRED', 'ADMIN_OVERRIDE'];
    const msgs = [
      'Inspection #BATCH-2024-0001 analysis completed. Recommendation: REJECT',
      'Report for inspection #BATCH-2024-0002 is ready for download.',
      'Inspection #BATCH-2024-0003 requires manual supervisor review.',
      'Admin has overridden AI recommendation for #BATCH-2024-0004.',
    ];
    for (let i = 0; i < 20; i++) {
      const user = inspectors[i % inspectors.length];
      this.notifications.push({
        id: uuidv4(),
        userId: user.id,
        type: types[i % types.length],
        title: types[i % types.length].replace(/_/g, ' '),
        message: msgs[i % msgs.length],
        read: i > 5,
        createdAt: new Date(Date.now() - i * 7200000),
      });
    }
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────
  findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  findInspectionById(id: string): Inspection | undefined {
    return this.inspections.find(i => i.id === id);
  }

  addInspection(inspection: Inspection): void {
    this.inspections.unshift(inspection);
  }

  updateInspection(id: string, updates: Partial<Inspection>): Inspection | undefined {
    const idx = this.inspections.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.inspections[idx] = { ...this.inspections[idx], ...updates, updatedAt: new Date() };
    return this.inspections[idx];
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    this.auditLogs.unshift({ ...log, id: uuidv4(), createdAt: new Date() });
  }

  addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): void {
    this.notifications.unshift({ ...notif, id: uuidv4(), createdAt: new Date() });
  }

  getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInspections = this.inspections.filter(i => i.createdAt >= today);
    const accepted = this.inspections.filter(i => i.status === 'ACCEPTED').length;
    const rejected = this.inspections.filter(i => i.status === 'REJECTED').length;
    const pending = this.inspections.filter(i => i.status === 'PENDING' || i.status === 'IN_PROGRESS').length;
    const manualReview = this.inspections.filter(i => i.status === 'MANUAL_REVIEW').length;
    const withAI = this.inspections.filter(i => i.aiAnalysis);
    const avgConfidence = withAI.length > 0
      ? Math.round(withAI.reduce((sum, i) => sum + (i.aiAnalysis?.confidence ?? 0), 0) / withAI.length)
      : 0;

    return {
      todayInspections: todayInspections.length,
      totalInspections: this.inspections.length,
      accepted,
      rejected,
      pending,
      manualReview,
      avgConfidence,
      acceptRate: Math.round((accepted / this.inspections.length) * 100),
      rejectRate: Math.round((rejected / this.inspections.length) * 100),
    };
  }

  getChartData() {
    // Last 30 days trend
    const trend = [];
    for (let d = 29; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86400000);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date.getTime() + 86400000);
      const dayInspections = this.inspections.filter(i => i.createdAt >= date && i.createdAt < nextDate);
      trend.push({
        date: date.toISOString().split('T')[0],
        total: dayInspections.length,
        accepted: dayInspections.filter(i => i.status === 'ACCEPTED').length,
        rejected: dayInspections.filter(i => i.status === 'REJECTED').length,
      });
    }

    // Damage categories
    const damageCounts: Record<string, number> = {};
    this.inspections.forEach(i => {
      const type = i.aiAnalysis?.damageType ?? 'NONE';
      damageCounts[type] = (damageCounts[type] ?? 0) + 1;
    });
    const damageCategories = Object.entries(damageCounts)
      .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count);

    return { trend, damageCategories };
  }
}

// Singleton
export const db = new DataStore();
