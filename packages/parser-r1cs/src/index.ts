import * as ff from 'ffjavascript';

export * from './types';

const R1CS_HEADER = 0x52494353; // "R1CS"
const R1CS_VERSION = 1;

export async function parseR1CS(buffer: ArrayBuffer): Promise<ParsedCircuit> {
  const data = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let offset = 0;

  // Заголовок
  const magic = view.getUint32(offset, true);
  offset += 4;
  if (magic !== R1CS_HEADER) {
    throw new Error('Invalid R1CS file: magic number mismatch');
  }

  const version = view.getUint32(offset, true);
  offset += 4;
  if (version !== R1CS_VERSION) {
    throw new Error(`Unsupported R1CS version: ${version}`);
  }

  const numSections = view.getUint32(offset, true);
  offset += 4;

  const sections: { type: number; size: number; dataOffset: number }[] = [];
  for (let i = 0; i < numSections; i++) {
    const type = view.getUint32(offset, true);
    offset += 4;
    const size = view.getUint32(offset, true);
    offset += 4;
    sections.push({ type, size, dataOffset: offset });
    offset += size;
  }

  let fieldSize = 0;
  let primeHex = '';
  let nWires = 0;
  let nPubOut = 0;
  let nPubIn = 0;
  let nPrvIn = 0;
  let constraints: any[] = [];
  let wireMap: number[] = [];

  for (const sec of sections) {
    const sectionData = new Uint8Array(buffer, sec.dataOffset, sec.size);
    const sectionView = new DataView(buffer, sec.dataOffset, sec.size);
    let sectionOffset = 0;

    if (sec.type === 1) {
      fieldSize = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;

      const primeBytes = sectionData.slice(sectionOffset, sectionOffset + fieldSize);
      const primeBigEndian = new Uint8Array([...primeBytes].reverse());
      primeHex = Array.from(primeBigEndian).map(b => b.toString(16).padStart(2, '0')).join('');
      sectionOffset += fieldSize;

      nWires = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      nPubOut = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      nPubIn = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      nPrvIn = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
    } else if (sec.type === 2) {
      const nConstraints = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;

      for (let i = 0; i < nConstraints; i++) {
        const readLinearCombination = (): { wire: number; coeff: Uint8Array }[] => {
          const nTerms = sectionView.getUint32(sectionOffset, true);
          sectionOffset += 4;
          const terms = [];
          for (let j = 0; j < nTerms; j++) {
            const wire = sectionView.getUint32(sectionOffset, true);
            sectionOffset += 4;
            const coeffBytes = sectionData.slice(sectionOffset, sectionOffset + fieldSize);
            sectionOffset += fieldSize;
            terms.push({ wire, coeff: coeffBytes });
          }
          return terms;
        };

        const a = readLinearCombination();
        const b = readLinearCombination();
        const c = readLinearCombination();
        constraints.push({ a, b, c });
      }
    } else if (sec.type === 3) {
      const n = sec.size / 4;
      for (let i = 0; i < n; i++) {
        wireMap.push(sectionView.getUint32(sectionOffset, true));
        sectionOffset += 4;
      }
    }
  }

  // Построение узлов
  const signals: CircuitNode[] = [];
  for (let i = 0; i < nWires; i++) {
    let name = `w${i}`;
    if (i === 0) name = 'ONE';
    else if (i < nPubOut) name = `out${i-1}`;
    else if (i < nPubOut + nPubIn) name = `pub_in${i - nPubOut}`;
    else if (i < nPubOut + nPubIn + nPrvIn) name = `prv_in${i - nPubOut - nPubIn}`;
    else name = `intermediate${i - nPubOut - nPubIn - nPrvIn}`;

    signals.push({
      id: `s${i}`,
      name,
      type: 'signal',
      line: i,
      complexity: 1,
      dependencies: [],
    });
  }

  const constraintNodes: CircuitNode[] = constraints.map((_, idx) => ({
    id: `c${idx}`,
    name: `Constraint ${idx}`,
    type: 'constraint',
    line: idx,
    complexity: 1,
    dependencies: [],
  }));

  const signalDeps: Set<string>[] = signals.map(() => new Set());
  const constraintDeps: Set<string>[] = constraints.map(() => new Set());

  constraints.forEach((constraint, idx) => {
    const processTerm = (term: { wire: number }) => {
      const wireIdx = term.wire;
      if (wireIdx < signals.length) {
        signalDeps[wireIdx].add(`c${idx}`);
        constraintDeps[idx].add(`s${wireIdx}`);
      }
    };
    constraint.a.forEach(processTerm);
    constraint.b.forEach(processTerm);
    constraint.c.forEach(processTerm);
  });

  signals.forEach((sig, i) => {
    sig.dependencies = Array.from(signalDeps[i]);
  });
  constraintNodes.forEach((con, i) => {
    con.dependencies = Array.from(constraintDeps[i]);
  });

  const components: CircuitNode[] = [];
  const totalComplexity = signals.reduce((acc, s) => acc + s.complexity, 0) +
                          constraintNodes.reduce((acc, c) => acc + c.complexity, 0);

  return {
    name: 'circuit',
    signals,
    components,
    constraints: constraintNodes,
    totalComplexity,
    nPublic: nPubIn,
    nPrivate: nPrvIn,
    nOutputs: nPubOut,
    prime: primeHex,
  };
}
