import * as ff from 'ffjavascript';

// Типы данных для совместимости с существующим интерфейсом
export interface CircuitNode {
  id: string;
  name: string;
  type: 'signal' | 'component' | 'constraint';
  line: number;        // в .r1cs нет строк, используем индекс сигнала/ограничения
  complexity: number;  // можно вычислить как степень вхождения
  dependencies: string[];
}

export interface ParsedCircuit {
  name: string;
  signals: CircuitNode[];
  components: CircuitNode[]; // в .r1cs нет компонентов, оставим пустым или извлечём из имён сигналов
  constraints: CircuitNode[];
  totalComplexity: number;
  // Добавим метаданные
  nPublic: number;
  nPrivate: number;
  nOutputs: number;
  prime: string;
}

// Магические числа формата r1cs
const R1CS_HEADER = 0x52494353; // "R1CS" в little-endian
const R1CS_VERSION = 1;

/**
 * Разбирает .r1cs файл (бинарный формат circom)
 * @param file - загруженный файл .r1cs
 * @returns ParsedCircuit
 */
export async function parseCircomFile(file: File): Promise<ParsedCircuit> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let offset = 0;

  // Читаем заголовок
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

  // Количество полей (секций)
  const numSections = view.getUint32(offset, true);
  offset += 4;

  // Секции: обычно 3 (заголовок, ограничения, карта сигналов)
  // Но мы прочитаем все секции
  const sections: { type: number; size: number; dataOffset: number }[] = [];
  for (let i = 0; i < numSections; i++) {
    const type = view.getUint32(offset, true);
    offset += 4;
    const size = view.getUint32(offset, true);
    offset += 4;
    sections.push({ type, size, dataOffset: offset });
    offset += size;
  }

  // Данные будем хранить здесь
  let fieldSize = 0;
  let prime: string = '';
  let nWires = 0;
  let nPubOut = 0;
  let nPubIn = 0;
  let nPrvIn = 0;
  let constraints: any[] = [];
  let wireMap: number[] = [];

  // Обрабатываем каждую секцию
  for (const sec of sections) {
    const sectionData = new Uint8Array(buffer, sec.dataOffset, sec.size);
    const sectionView = new DataView(buffer, sec.dataOffset, sec.size);
    let sectionOffset = 0;

    if (sec.type === 1) {
      // Секция заголовка
      fieldSize = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      // Размер элемента поля в байтах (для нашего случая обычно 32 или 64)
      // Читаем простое число (prime) в big-endian? В circom prime хранится как big integer в little-endian?
      // Упростим: сохраним первые 32 байта как hex
      const primeBytes = sectionData.slice(sectionOffset, sectionOffset + fieldSize);
      prime = Array.from(primeBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      sectionOffset += fieldSize;

      nWires = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      nPubOut = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      nPubIn = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      nPrvIn = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;
      // Ещё зарезервированные поля, но пропустим
    } else if (sec.type === 2) {
      // Секция ограничений
      const nConstraints = sectionView.getUint32(sectionOffset, true);
      sectionOffset += 4;

      for (let i = 0; i < nConstraints; i++) {
        // Каждое ограничение: линейная комбинация A, B, C
        // Каждая комбинация: количество членов, затем для каждого члена (wire, coefficient)
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
      // Карта проводов (wire map) — связь между индексами проводов и именами сигналов? Обычно здесь ничего нет.
      // По спецификации, это может быть карта для отладки, но в circom она часто пуста.
      // Можно попытаться прочитать как массив int32
      const n = sec.size / 4;
      for (let i = 0; i < n; i++) {
        wireMap.push(sectionView.getUint32(sectionOffset, true));
        sectionOffset += 4;
      }
    }
  }

  // Построим узлы для визуализации
  // Сигналы (провода)
  const signals: CircuitNode[] = [];
  for (let i = 0; i < nWires; i++) {
    // Определим тип сигнала на основе индекса (по соглашению circom)
    let type: 'signal' | 'component' = 'signal';
    let name = `w${i}`;
    if (i === 0) name = 'ONE'; // специальный сигнал
    else if (i < nPubOut) name = `out${i-1}`;
    else if (i < nPubOut + nPubIn) name = `pub_in${i - nPubOut}`;
    else if (i < nPubOut + nPubIn + nPrvIn) name = `prv_in${i - nPubOut - nPubIn}`;
    else name = `intermediate${i - nPubOut - nPubIn - nPrvIn}`;

    signals.push({
      id: `s${i}`,
      name,
      type: 'signal',
      line: i, // используем индекс как строку
      complexity: 1, // позже можно вычислить степень вхождения
      dependencies: [],
    });
  }

  // Ограничения как узлы
  const constraintNodes: CircuitNode[] = constraints.map((_, idx) => ({
    id: `c${idx}`,
    name: `Constraint ${idx}`,
    type: 'constraint',
    line: idx,
    complexity: 1,
    dependencies: [],
  }));

  // Построим зависимости: для каждого ограничения, сигналы, которые в него входят
  // Это нужно для визуализации связей между сигналами и ограничениями
  const signalDeps: Set<string>[] = signals.map(() => new Set());
  const constraintDeps: Set<string>[] = constraints.map(() => new Set());

  constraints.forEach((constraint, idx) => {
    const processTerm = (term: { wire: number }) => {
      const wireIdx = term.wire;
      if (wireIdx < signals.length) {
        // сигнал зависит от этого ограничения
        signalDeps[wireIdx].add(`c${idx}`);
        // ограничение зависит от сигнала
        constraintDeps[idx].add(`s${wireIdx}`);
      }
    };
    constraint.a.forEach(processTerm);
    constraint.b.forEach(processTerm);
    constraint.c.forEach(processTerm);
  });

  // Заполним зависимости в узлах
  signals.forEach((sig, i) => {
    sig.dependencies = Array.from(signalDeps[i]);
  });
  constraintNodes.forEach((con, i) => {
    con.dependencies = Array.from(constraintDeps[i]);
  });

  // Компоненты — в .r1cs нет, оставим пустым
  const components: CircuitNode[] = [];

  // Общая сложность — сумма сложностей (можно использовать количество вхождений)
  const totalComplexity = signals.reduce((acc, s) => acc + s.complexity, 0) +
                          constraintNodes.reduce((acc, c) => acc + c.complexity, 0);

  return {
    name: file.name,
    signals,
    components,
    constraints: constraintNodes,
    totalComplexity,
    nPublic: nPubIn,
    nPrivate: nPrvIn,
    nOutputs: nPubOut,
    prime,
  };
}
