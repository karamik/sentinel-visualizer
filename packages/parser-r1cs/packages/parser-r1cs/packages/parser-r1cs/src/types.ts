export interface CircuitNode {
  id: string;
  name: string;
  type: 'signal' | 'component' | 'constraint';
  line: number;
  complexity: number;
  dependencies: string[];
}

export interface ParsedCircuit {
  name: string;
  signals: CircuitNode[];
  components: CircuitNode[];
  constraints: CircuitNode[];
  totalComplexity: number;
  nPublic: number;
  nPrivate: number;
  nOutputs: number;
  prime: string;
}
