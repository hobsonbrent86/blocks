export type StepStatus = "pass" | "fail" | "skip" | "na";
export type CheckSeverity = "P0" | "P1" | "P2";

export interface CheckResult {
  id: string;
  severity: CheckSeverity;
  status: StepStatus;
  message: string;
  path?: string;
  blockId?: string;
}

export interface InspectStep {
  id: string;
  label: string;
  status: StepStatus;
  message?: string;
}

export interface InspectSummary {
  pass: number;
  fail: number;
  skip: number;
  na: number;
}

export interface InspectReport {
  ok: boolean;
  path: string;
  block?: string;
  graph?: string;
  summary: InspectSummary;
  steps: InspectStep[];
  checks: CheckResult[];
  guide?: BlockGuide;
}

export interface BlockGuideElement {
  label: string;
  detail: string;
}

export interface BlockGuide {
  purpose: string;
  elements: BlockGuideElement[];
}

export type BlockSpecies =
  | "ingress"
  | "transform"
  | "validate"
  | "persist"
  | "emit"
  | "gate"
  | "query";

export interface PortDefinition {
  type: string;
  description?: string;
}

export interface LayerDefinition {
  status: "implemented" | "inherited" | "na";
  rationale?: string;
  inherits_from?: string;
}

export interface BlockContract {
  id: string;
  species: BlockSpecies;
  version: string;
  description?: string;
  core: { verb: string; description: string };
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  failure_modes: Record<string, { retry: "none" | "retryable" | "terminal"; description?: string }>;
  idempotency: "pure" | "idempotent_write" | "append_only" | "dangerous";
  effects: Array<"read" | "write" | "external_call" | "human_gate">;
  layers: Record<string, LayerDefinition>;
  heresy?: { type: string; rationale: string; explode_by?: string };
  human_setup?: HumanSetupItem[];
}

export interface HumanSetupItem {
  id: string;
  description: string;
  env?: string;
  command?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface BlockGraph {
  id: string;
  version: string;
  description?: string;
  blocks: string[];
  entries?: string[];
  exits?: string[];
  edges: GraphEdge[];
  heresy?: { type: string; rationale: string; explode_by?: string };
}

export interface BlockRecord {
  id: string;
  species: BlockSpecies;
  name: string;
  dir: string;
  contractPath: string;
  contract: BlockContract;
  coreFiles: string[];
  layerFiles: string[];
}

export interface BlocksConfig {
  version: number;
  language: string;
  paths: {
    blocks: string;
    graphs: string;
    shared: string;
  };
  verify?: {
    strict?: boolean;
    allowed_heresies?: string[];
  };
}

export interface RepoSnapshot {
  root: string;
  config: BlocksConfig;
  blocks: BlockRecord[];
  graphs: BlockGraph[];
}

export interface VerifyOptions {
  path?: string;
  graph?: string;
  block?: string;
  strict?: boolean;
}

export interface InspectBlockOptions extends VerifyOptions {
  runTests?: boolean;
}

export interface TestCase {
  name: string;
  in?: Record<string, unknown>;
  out?: Record<string, unknown>;
  throws?: string;
  chain?: ChainStep[];
}

export interface ChainStep {
  block?: string;
  in: Record<string, unknown>;
  save?: string;
  out?: Record<string, unknown>;
  throws?: string;
}

export interface TestFixture {
  cases: TestCase[];
}

export interface TestCaseResult {
  name: string;
  status: "pass" | "fail";
  message?: string;
}

export interface BlockTestResult {
  blockId: string;
  ok: boolean;
  cases: TestCaseResult[];
  chainCases?: TestCaseResult[];
  message?: string;
}

export interface TestOptions {
  path?: string;
  block?: string;
  graph?: string;
  fixture?: string;
  verbose?: boolean;
}

export interface GraphTestResult {
  graphId: string;
  ok: boolean;
  cases: TestCaseResult[];
  message?: string;
}

export const REQUIRED_LAYERS = ["validation", "security", "observability"] as const;

export const LAYER_LABELS: Record<string, string> = {
  input: "Input",
  contract: "Contract",
  validation: "Validation",
  security: "Security",
  observability: "Observability",
  resilience: "Resilience",
  core: "Core",
  chain: "Chain",
  human: "Human setup",
  output: "Output",
};
