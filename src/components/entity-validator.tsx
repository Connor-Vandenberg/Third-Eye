'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, ChevronDown,
  Database, Code, RefreshCw, Copy, Download, Eye, Zap
} from 'lucide-react';

export type ValidationSeverity = 'error' | 'warning' | 'info' | 'pass';

export interface ValidationRule {
  id: string;
  category: string;
  description: string;
  severity: ValidationSeverity;
  validator: (entity: any, schema: any) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  severity: ValidationSeverity;
  message: string;
  field?: string;
  expected?: any;
  actual?: any;
  suggestion?: string;
}

export interface SchemaDefinition {
  vertexType: string;
  requiredAttributes: Array<{ name: string; type: string; description?: string }>;
  optionalAttributes: Array<{ name: string; type: string; description?: string }>;
  requiredEdges: Array<{ type: string; direction: 'in' | 'out'; targetVertex: string; minCount?: number }>;
  constraints: Array<{ field: string; rule: string; params?: any }>;
  decayHours?: number;
  domain?: string;
}

export interface EntityValidatorProps {
  entity: any;
  schema: SchemaDefinition;
  onValidate?: (results: ValidationResult[]) => void;
  onFix?: (field: string, suggestion: any) => void;
  showRawData?: boolean;
  autoValidate?: boolean;
  className?: string;
}

const SEVERITY_CONFIG: Record<ValidationSeverity, { color: string; icon: any; label: string; bgColor: string }> = {
  error: { color: '#ef4444', icon: XCircle, label: 'Error', bgColor: 'rgba(239,68,68,0.1)' },
  warning: { color: '#f59e0b', icon: AlertTriangle, label: 'Warning', bgColor: 'rgba(245,158,11,0.1)' },
  info: { color: '#3b82f6', icon: Eye, label: 'Info', bgColor: 'rgba(59,130,246,0.1)' },
  pass: { color: '#10b981', icon: CheckCircle, label: 'Pass', bgColor: 'rgba(16,185,129,0.1)' },
};

// Built-in validation rules (Anduril Developer Console equivalent)
function createValidationRules(schema: SchemaDefinition): ValidationRule[] {
  const rules: ValidationRule[] = [];

  // Required attribute checks
  schema.requiredAttributes.forEach(attr => {
    rules.push({
      id: `required-${attr.name}`,
      category: 'Schema Compliance',
      description: `Required attribute "${attr.name}" (${attr.type}) must be present and non-null`,
      severity: 'error',
      validator: (entity) => {
        const value = entity[attr.name];
        if (value === undefined || value === null || value === '') {
          return { passed: false, severity: 'error', message: `Missing required attribute: ${attr.name}`, field: attr.name, expected: attr.type, actual: value, suggestion: `Add ${attr.name} field with type ${attr.type}` };
        }
        return { passed: true, severity: 'pass', message: `${attr.name} present`, field: attr.name };
      },
    });
  });

  // Type checks
  [...schema.requiredAttributes, ...schema.optionalAttributes].forEach(attr => {
    rules.push({
      id: `type-${attr.name}`,
      category: 'Type Safety',
      description: `Attribute "${attr.name}" should be of type ${attr.type}`,
      severity: 'warning',
      validator: (entity) => {
        const value = entity[attr.name];
        if (value === undefined || value === null) return { passed: true, severity: 'pass', message: `${attr.name} not present (optional)` };

        let typeMatch = false;
        switch (attr.type) {
          case 'STRING': typeMatch = typeof value === 'string'; break;
          case 'INT': case 'UINT': typeMatch = typeof value === 'number' && Number.isInteger(value); break;
          case 'DOUBLE': case 'FLOAT': typeMatch = typeof value === 'number'; break;
          case 'BOOL': typeMatch = typeof value === 'boolean'; break;
          case 'DATETIME': typeMatch = !isNaN(Date.parse(value)); break;
          case 'LIST': typeMatch = Array.isArray(value); break;
          default: typeMatch = true;
        }

        if (!typeMatch) {
          return { passed: false, severity: 'warning', message: `${attr.name} type mismatch: expected ${attr.type}, got ${typeof value}`, field: attr.name, expected: attr.type, actual: typeof value };
        }
        return { passed: true, severity: 'pass', message: `${attr.name} type correct` };
      },
    });
  });

  // Vertex type check
  rules.push({
    id: 'vertex-type',
    category: 'Identity',
    description: `Entity must declare vertex type as "${schema.vertexType}"`,
    severity: 'error',
    validator: (entity) => {
      if (entity.vertexType !== schema.vertexType && entity.type !== schema.vertexType) {
        return { passed: false, severity: 'error', message: `Vertex type mismatch: expected ${schema.vertexType}`, field: 'vertexType', expected: schema.vertexType, actual: entity.vertexType || entity.type };
      }
      return { passed: true, severity: 'pass', message: 'Vertex type matches' };
    },
  });

  // Temporal decay check
  if (schema.decayHours) {
    rules.push({
      id: 'temporal-freshness',
      category: 'Temporal',
      description: `Entity should have been updated within ${schema.decayHours}h (decay window)`,
      severity: 'warning',
      validator: (entity) => {
        const lastUpdated = entity.lastUpdated || entity.last_updated || entity.timestamp;
        if (!lastUpdated) return { passed: false, severity: 'warning', message: 'No timestamp for decay check', suggestion: 'Add lastUpdated field' };
        const age = (Date.now() - new Date(lastUpdated).getTime()) / 3600000;
        if (age > schema.decayHours!) {
          return { passed: false, severity: 'warning', message: `Entity is ${age.toFixed(1)}h old (decay window: ${schema.decayHours}h)`, field: 'lastUpdated', suggestion: 'Schedule re-collection or apply decay factor' };
        }
        return { passed: true, severity: 'pass', message: `Fresh (${age.toFixed(1)}h < ${schema.decayHours}h)` };
      },
    });
  }

  // Confidence score range check
  rules.push({
    id: 'confidence-range',
    category: 'Data Quality',
    description: 'Confidence/convergence scores should be 0-100',
    severity: 'warning',
    validator: (entity) => {
      const scores = ['confidence', 'convergenceScore', 'riskScore', 'instabilityIndex'].filter(f => entity[f] !== undefined);
      for (const field of scores) {
        const val = entity[field];
        if (typeof val === 'number' && (val < 0 || val > 100)) {
          return { passed: false, severity: 'warning', message: `${field} out of range: ${val} (expected 0-100)`, field, expected: '0-100', actual: val };
        }
      }
      return { passed: true, severity: 'pass', message: 'All scores in valid range' };
    },
  });

  // Source provenance check
  rules.push({
    id: 'provenance',
    category: 'Provenance',
    description: 'Entity should have source attribution (NATO STANAG 2022)',
    severity: 'info',
    validator: (entity) => {
      if (!entity.source && !entity.sources && !entity.admiraltyReliability) {
        return { passed: false, severity: 'info', message: 'No source provenance attached', suggestion: 'Add source field with NATO Admiralty code (A1-F6)' };
      }
      return { passed: true, severity: 'pass', message: 'Source provenance present' };
    },
  });

  return rules;
}

export function EntityValidator({
  entity,
  schema,
  onValidate,
  onFix,
  showRawData = false,
  autoValidate = true,
  className = '',
}: EntityValidatorProps) {
  const [showRaw, setShowRaw] = useState(showRawData);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Schema Compliance', 'Type Safety']));

  const rules = useMemo(() => createValidationRules(schema), [schema]);

  const results = useMemo(() => {
    const res = rules.map(rule => ({ rule, result: rule.validator(entity, schema) }));
    onValidate?.(res.map(r => r.result));
    return res;
  }, [entity, schema, rules, onValidate]);

  const summary = useMemo(() => {
    const counts = { error: 0, warning: 0, info: 0, pass: 0 };
    results.forEach(r => { counts[r.result.severity]++; });
    return counts;
  }, [results]);

  const categorized = useMemo(() => {
    const cats: Record<string, typeof results> = {};
    results.forEach(r => {
      if (!cats[r.rule.category]) cats[r.rule.category] = [];
      cats[r.rule.category].push(r);
    });
    return cats;
  }, [results]);

  const overallStatus: ValidationSeverity = summary.error > 0 ? 'error' : summary.warning > 0 ? 'warning' : 'pass';
  const overallConfig = SEVERITY_CONFIG[overallStatus];
  const OverallIcon = overallConfig.icon;

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: overallConfig.bgColor, border: `1px solid ${overallConfig.color}30` }}>
            <OverallIcon className="w-4 h-4" style={{ color: overallConfig.color }} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Schema Validation</h3>
            <p className="text-[9px] text-zinc-500">Validating against: {schema.vertexType} ({schema.domain || 'GENERAL'})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Summary badges */}
          {summary.error > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">{summary.error} errors</span>}
          {summary.warning > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">{summary.warning} warnings</span>}
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{summary.pass} passed</span>
        </div>
      </div>

      {/* Validation Results by Category */}
      <div className="divide-y divide-zinc-800/50">
        {Object.entries(categorized).map(([category, catResults]) => {
          const isExpanded = expandedCategories.has(category);
          const catErrors = catResults.filter(r => !r.result.passed).length;
          const catPassed = catResults.filter(r => r.result.passed).length;

          return (
            <div key={category}>
              <button onClick={() => toggleCategory(category)} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                  <span className="text-[10px] font-medium text-zinc-300">{category}</span>
                  <span className="text-[8px] text-zinc-600">({catResults.length} checks)</span>
                </div>
                <div className="flex items-center gap-1">
                  {catErrors > 0 && <span className="text-[8px] text-red-400">{catErrors} failed</span>}
                  <span className="text-[8px] text-emerald-400">{catPassed}✓</span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-2 space-y-1">
                      {catResults.map(({ rule, result }) => {
                        const config = SEVERITY_CONFIG[result.severity];
                        const Icon = config.icon;
                        return (
                          <div key={rule.id} className="flex items-start gap-2 pl-5 py-1">
                            <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-zinc-300">{result.message}</p>
                              {result.field && !result.passed && (
                                <div className="flex items-center gap-2 mt-0.5 text-[8px]">
                                  {result.expected && <span className="text-zinc-500">Expected: <span className="text-emerald-400 font-mono">{JSON.stringify(result.expected)}</span></span>}
                                  {result.actual !== undefined && <span className="text-zinc-500">Got: <span className="text-red-400 font-mono">{JSON.stringify(result.actual)}</span></span>}
                                </div>
                              )}
                              {result.suggestion && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Zap className="w-2.5 h-2.5 text-cyan-400" />
                                  <span className="text-[8px] text-cyan-400">{result.suggestion}</span>
                                  {onFix && result.field && (
                                    <button onClick={() => onFix(result.field!, result.expected)} className="text-[7px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
                                      Fix
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Raw Data Toggle */}
      <div className="border-t border-zinc-800 px-4 py-2">
        <button onClick={() => setShowRaw(!showRaw)} className="text-[9px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
          <Code className="w-3 h-3" /> {showRaw ? 'Hide' : 'Show'} Raw Entity Data
        </button>
        <AnimatePresence>
          {showRaw && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <pre className="mt-2 p-3 bg-zinc-800/50 rounded-lg text-[9px] font-mono text-zinc-400 overflow-x-auto max-h-[200px] overflow-y-auto">
                {JSON.stringify(entity, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default EntityValidator;
