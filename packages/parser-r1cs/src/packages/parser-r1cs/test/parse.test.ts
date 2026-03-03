import { parseR1CS } from '../src';
import * as fs from 'fs';
import * as path from 'path';

describe('parseR1CS', () => {
  it('should throw on invalid header', async () => {
    const buffer = new ArrayBuffer(8);
    await expect(parseR1CS(buffer)).rejects.toThrow('Invalid R1CS file');
  });

  // Тест с реальным .r1cs файлом, если он существует в examples
  it('should parse multiplier.r1cs correctly', async () => {
    // Путь к примеру (относительно корня пакета)
    const examplePath = path.join(__dirname, '../../../../examples/multiplier.r1cs');
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(examplePath)) {
      console.warn('Skipping test: multiplier.r1cs not found');
      return;
    }

    const buffer = await fs.promises.readFile(examplePath);
    const circuit = await parseR1CS(buffer.buffer);

    expect(circuit).toBeDefined();
    expect(circuit.signals.length).toBeGreaterThan(0);
    expect(circuit.constraints.length).toBeGreaterThan(0);
    expect(circuit.nPublic).toBeDefined();
    expect(circuit.nPrivate).toBeDefined();
    expect(circuit.prime).toBeTruthy();
  });

  it('should parse merkle.r1cs correctly', async () => {
    const examplePath = path.join(__dirname, '../../../../examples/merkle.r1cs');
    if (!fs.existsSync(examplePath)) {
      console.warn('Skipping test: merkle.r1cs not found');
      return;
    }

    const buffer = await fs.promises.readFile(examplePath);
    const circuit = await parseR1CS(buffer.buffer);

    expect(circuit).toBeDefined();
    expect(circuit.constraints.length).toBeGreaterThan(1);
  });
});
