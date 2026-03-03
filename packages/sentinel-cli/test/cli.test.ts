import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import util from 'util';

const execPromise = util.promisify(exec);

describe('Sentinel CLI', () => {
  const cliPath = path.join(__dirname, '../dist/index.js');
  const examplesDir = path.join(__dirname, '../../../examples');
  const tempDir = path.join(__dirname, '../temp-test');

  beforeAll(async () => {
    await fs.ensureDir(tempDir);
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('should show help', async () => {
    const { stdout } = await execPromise(`node ${cliPath} --help`);
    expect(stdout).toContain('Usage');
    expect(stdout).toContain('analyze');
  });

  it('should analyze a single .r1cs file', async () => {
    const filePath = path.join(examplesDir, 'multiplier.r1cs');
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      console.warn('Skipping test: multiplier.r1cs not found');
      return;
    }

    const { stdout } = await execPromise(`node ${cliPath} --path ${examplesDir} --format json`);
    const output = JSON.parse(stdout);
    expect(Array.isArray(output)).toBe(true);
    expect(output.length).toBeGreaterThan(0);
    const multiplier = output.find((r: any) => r.file === 'multiplier.r1cs');
    expect(multiplier).toBeDefined();
    expect(multiplier.constraints).toBeDefined();
  });

  it('should output markdown', async () => {
    const filePath = path.join(examplesDir, 'multiplier.r1cs');
    if (!(await fs.pathExists(filePath))) return;

    const { stdout } = await execPromise(`node ${cliPath} --path ${examplesDir} --format markdown`);
    expect(stdout).toContain('# Circuit Analysis Report');
    expect(stdout).toContain('## multiplier.r1cs');
    expect(stdout).toContain('- Constraints:');
  });

  it('should output html', async () => {
    const filePath = path.join(examplesDir, 'multiplier.r1cs');
    if (!(await fs.pathExists(filePath))) return;

    const { stdout } = await execPromise(`node ${cliPath} --path ${examplesDir} --format html`);
    expect(stdout).toContain('<html');
    expect(stdout).toContain('<table');
  });

  it('should write output to file', async () => {
    const filePath = path.join(examplesDir, 'multiplier.r1cs');
    if (!(await fs.pathExists(filePath))) return;

    const outFile = path.join(tempDir, 'report.md');
    await execPromise(`node ${cliPath} --path ${examplesDir} --format markdown --output ${outFile}`);
    const exists = await fs.pathExists(outFile);
    expect(exists).toBe(true);
    const content = await fs.readFile(outFile, 'utf8');
    expect(content).toContain('# Circuit Analysis Report');
  });
});
