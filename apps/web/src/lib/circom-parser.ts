// Базовый парсер Circom файлов
// Пока без WASM — чистый TypeScript для MVP

export interface CircuitNode {
  id: string;
  type: 'signal' | 'component' | 'constraint';
  name: string;
  line: number;
  dependencies: string[];
  complexity: number; // 1-10, для heatmap
}

export interface ParsedCircuit {
  name: string;
  signals: CircuitNode[];
  components: CircuitNode[];
  constraints: CircuitNode[];
  totalComplexity: number;
  lines: number;
}

export class CircomParser {
  private source: string;
  private lines: string[];

  constructor(source: string) {
    this.source = source;
    this.lines = source.split('\n');
  }

  parse(): ParsedCircuit {
    const signals: CircuitNode[] = [];
    const components: CircuitNode[] = [];
    const constraints: CircuitNode[] = [];

    let circuitName = 'Unknown';

    this.lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Имя circuit
      if (trimmed.startsWith('template ')) {
        circuitName = trimmed.replace('template ', '').replace('{', '').trim();
      }

      // Сигналы
      if (trimmed.startsWith('signal ')) {
        const signal = this.parseSignal(trimmed, index);
        signals.push(signal);
      }

      // Компоненты
      if (trimmed.includes('Component(') || trimmed.includes('new ')) {
        const component = this.parseComponent(trimmed, index);
        components.push(component);
      }

      // Constraints (примитивно: строки с === или <==)
      if (trimmed.includes('===') || trimmed.includes('<==')) {
        const constraint = this.parseConstraint(trimmed, index);
        constraints.push(constraint);
      }
    });

    const totalComplexity = this.calculateComplexity(signals, components, constraints);

    return {
      name: circuitName,
      signals,
      components,
      constraints,
      totalComplexity,
      lines: this.lines.length,
    };
  }

  private parseSignal(line: string, lineNum: number): CircuitNode {
    const parts = line.replace('signal ', '').split(' ');
    const name = parts[parts.length - 1].replace(';', '');
    
    return {
      id: `sig-${lineNum}`,
      type: 'signal',
      name,
      line: lineNum,
      dependencies: [],
      complexity: 1,
    };
  }

  private parseComponent(line: string, lineNum: number): CircuitNode {
    const match = line.match(/(\w+)\s*=\s*/);
    const name = match ? match[1] : `comp-${lineNum}`;

    return {
      id: `comp-${lineNum}`,
      type: 'component',
      name,
      line: lineNum,
      dependencies: [],
      complexity: 5, // Компоненты сложнее сигналов
    };
  }

  private parseConstraint(line: string, lineNum: number): CircuitNode {
    // Извлекаем зависимости (простая эвристика)
    const deps = this.extractDependencies(line);
    
    return {
      id: `constr-${lineNum}`,
      type: 'constraint',
      name: `constraint-${lineNum}`,
      line: lineNum,
      dependencies: deps,
      complexity: this.estimateConstraintComplexity(line),
    };
  }

  private extractDependencies(line: string): string[] {
    const deps: string[] = [];
    const matches = line.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    
    matches.forEach(match => {
      if (!['signal', 'var', 'template', 'component'].includes(match)) {
        deps.push(match);
      }
    });

    return [...new Set(deps)]; // Уникальные
  }

  private estimateConstraintComplexity(line: string): number {
    let complexity = 3; // Базовая
    
    // Умножение сложнее сложения
    if (line.includes('*')) complexity += 2;
    if (line.includes('**')) complexity += 4; // Степень
    if (line.includes('Poseidon') || line.includes('MiMC')) complexity += 5;
    
    return Math.min(complexity, 10);
  }

  private calculateComplexity(
    signals: CircuitNode[],
    components: CircuitNode[],
    constraints: CircuitNode[]
  ): number {
    const total = 
      signals.length * 1 +
      components.length * 5 +
      constraints.reduce((sum, c) => sum + c.complexity, 0);
    
    return Math.min(Math.floor(total / 10), 100);
  }
}

// Утилита для чтения файла
export async function parseCircomFile(file: File): Promise<ParsedCircuit> {
  const text = await file.text();
  const parser = new CircomParser(text);
  return parser.parse();
}
