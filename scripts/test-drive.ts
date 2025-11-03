import 'dotenv/config';
import { ensureTcarFolder } from '../server/google-drive';

async function main() {
  const tcar = process.argv[2] || '202510-0001';
  try {
    const id = await ensureTcarFolder(tcar);
    console.log('OK ensureTcarFolder:', id);
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.message || String(e);
    console.error('ERROR ensureTcarFolder:', msg);
    process.exitCode = 1;
  }
}

main();

