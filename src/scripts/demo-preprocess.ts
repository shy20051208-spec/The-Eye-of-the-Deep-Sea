import fs from 'fs';
import path from 'path';
import { preprocessMeasurements } from '@/lib/data-cleaning';

const demoPath = path.join(process.cwd(), 'src', 'scripts', 'demo_data.json');
const outPath = path.join(process.cwd(), 'tmp_preprocess_demo.json');

async function run() {
  const raw: any[] = JSON.parse(fs.readFileSync(demoPath, { encoding: 'utf8' }));
  const { cleaned, report, binAvg } = preprocessMeasurements(raw as any[]);
  console.log('Report:', report);
  console.log('First 3 cleaned:', cleaned.slice(0, 3));
  fs.writeFileSync(outPath, JSON.stringify({ report, cleaned, binAvg }, null, 2), 'utf8');
  console.log('Wrote demo output to', outPath);
}

run().catch((e) => {
  console.error('Demo preprocess failed:', e);
  process.exit(1);
});
