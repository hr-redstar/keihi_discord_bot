import fs from 'fs/promises';
import path from 'path';

const dataDir = path.resolve('./data');
const shopsFilePath = path.join(dataDir, 'kpi_shops.json');

export async function readShopList() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(shopsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    console.error('店舗リスト読み込みエラー:', e);
    return [];
  }
}

export async function addShop(shopName) {
  const shops = await readShopList();
  if (shops.includes(shopName)) {
    return false;
  }
  shops.push(shopName);
  try {
    await fs.writeFile(shopsFilePath, JSON.stringify(shops, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('店舗リスト書き込みエラー:', e);
    return false;
  }
}
