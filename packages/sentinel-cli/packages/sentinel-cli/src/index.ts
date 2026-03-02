#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

interface AnalysisResult {
  file: string;
  constraints: number;
  signals: number;
  components: number;
  complexity: number;
}

program
  .version('0.1.0')
  .description('Sentinel CLI - Analyze ZK circuits')
  .option('-p, --path <path>', 'Path to circuit files', './circuits')
  .option('-f, --format <format>', 'Output format (json, markdown, html)', 'markdown')
  .option('-o, --output <file>', 'Output file')
  .option('-k, --license-key <key>', 'License key for Pro features')
  .parse(process.argv);

const options = program.opts();

async function analyzeFile(filePath: string): Promise<AnalysisResult | null> {
  try {
    const buffer = await fs.readFile(filePath);
    // Здесь должен быть реальный парсер R1CS, но для демо возвращаем заглушку
    // В реальности нужно использовать @sentinel/parser-circom или аналоги
    return {
      file: path.basename(filePath),
      constraints: Math.floor(Math.random() * 100) + 1,
      signals: Math.floor(Math.random() * 200) + 10,
      components: Math.floor(Math.random() * 20) + 1,
      complexity: Math.floor(Math.random() * 50) + 1,
    };
  } catch (err) {
    console.error(chalk.red(`Error reading ${filePath}:`), err);
    return null;
  }
}

function formatMarkdown(results: AnalysisResult[]): string {
  let md = '# Circuit Analysis Report\n\n';
  results.forEach(r => {
    md += `## ${r.file}\n`;
    md += `- Constraints: ${r.constraints}\n`;
    md += `- Signals: ${r.signals}\n`;
    md += `- Components: ${r.components}\n`;
    md += `- Complexity: ${r.complexity}\n\n`;
  });
  return md;
}

function formatJSON(results: AnalysisResult[]): string {
  return JSON.stringify(results, null, 2);
}

function formatHTML(results: AnalysisResult[]): string {
  let html = `<!DOCTYPE html>
<html>
<head><title>Sentinel Report</title>
<style>
body { font-family: sans-serif; background: #0a0a0a; color: #ccc; }
h1 { color: #00ff9d; }
table { border-collapse: collapse; width: 100%; }
th { background: #00ff9d; color: black; padding: 8px; }
td { border: 1px solid #333; padding: 8px; }
</style>
</head>
<body>
<h1>Circuit Analysis Report</h1>
<table>
<tr><th>File</th><th>Constraints</th><th>Signals</th><th>Components</th><th>Complexity</th></tr>`;
  results.forEach(r => {
    html += `<tr>
<td>${r.file}</td><td>${r.constraints}</td><td>${r.signals}</td><td>${r.components}</td><td>${r.complexity}</td>
</tr>`;
  });
  html += '</table></body></html>';
  return html;
}

async function main() {
  console.log(chalk.cyan('Sentinel CLI - Analyzing circuits...'));

  if (options.licenseKey) {
    console.log(chalk.gray('License key provided (validation skipped in demo)'));
  }

  const searchPath = path.join(options.path, '**/*.{r1cs,circom}');
  const files = await glob(searchPath, { nodir: true });

  if (files.length === 0) {
    console.log(chalk.yellow('No circuit files found in', options.path));
    return;
  }

  console.log(chalk.gray(`Found ${files.length} files`));

  const results: AnalysisResult[] = [];
  for (const file of files) {
    const res = await analyzeFile(file);
    if (res) results.push(res);
  }

  let output: string;
  switch (options.format) {
    case 'json':
      output = formatJSON(results);
      break;
    case 'html':
      output = formatHTML(results);
      break;
    case 'markdown':
    default:
      output = formatMarkdown(results);
  }

  if (options.output) {
    await fs.writeFile(options.output, output);
    console.log(chalk.green(`Report written to ${options.output}`));
  } else {
    console.log(output);
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});
