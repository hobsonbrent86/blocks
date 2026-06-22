import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parse } from "yaml";
import type { ErrorObject } from "ajv";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv2020 = require("ajv/dist/2020.js") as any;
const contractSchema = require("@blocks/schemas/contract.schema.json");
const graphSchema = require("@blocks/schemas/graph.schema.json");

const ajv = new Ajv2020({ allErrors: true, strict: false });

const validateContractSchema = ajv.compile(contractSchema);
const validateGraphSchema = ajv.compile(graphSchema);

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map(
    (e: ErrorObject) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`,
  );
}

export function validateContract(contract: unknown): string[] {
  const ok = validateContractSchema(contract);
  if (ok) return [];
  return formatErrors(validateContractSchema.errors);
}

export function validateGraph(graph: unknown): string[] {
  const ok = validateGraphSchema(graph);
  if (ok) return [];
  return formatErrors(validateGraphSchema.errors);
}

export function validateContractFile(path: string): string[] {
  return validateContract(parse(readFileSync(path, "utf8")));
}

export function validateGraphFile(path: string): string[] {
  return validateGraph(parse(readFileSync(path, "utf8")));
}
