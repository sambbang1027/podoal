import { chromium } from 'playwright';

// 실제 라우팅: SETTING → READY → QUEUE → CAPTCHA → ZONE → SEAT → RESULT
// HashRouter 사용으로 URL 형식: http://localhost:5174/podoal/#/ready
const BASE = 'http://localhost:5174/podoal/';
function log(icon, msg) { console.log(`${icon} ${msg}`); }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function newPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  return { browser, page };
}

// ── SETTING ──
async function doSetting(page) {
  await page.goto(BASE);
  await page.waitForSelector('text=PODOAL FIGHTER');
  await page.click('text=중대규모');
  await page.fill('input[placeholder*="NCT"]', '테스트콘서트');
  await page.click('text=훈련 시작');
  log('✅', 'SETTING 완료');
}

// ── READY ──
// 흐름: "10초 전" 클릭 → 카운트다운 (10초) → active 상태
//        → 날짜 선택 → 시간 선택 → "예매하기" 클릭
async function doReady(page) {
  await page.waitForURL('**#/ready', { timeout: 5000 });
  await page.click('button:has-text("10초 전")');
  log('✅', 'READY: 10초 카운트다운 시작');
  // active 단계 진입 확인 — 날짜 버튼이 DOM에 나타날 때까지 대기 (최대 15초)
  await page.waitForSelector('button:has-text("2026년 06월 06일")', { timeout: 15000 });
  await page.locator('button').filter({ hasText: '2026년 06월 06일' }).click();
  await wait(200);
  await page.locator('button').filter({ hasText: '17:00' }).first().click();
  await wait(200);
  // canBook = true → "예매하기" 버튼 활성화
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '예매하기');
    return btn && !btn.disabled;
  }, { timeout: 3000 });
  await page.click('button:has-text("예매하기")');
  log('✅', 'READY → 예매하기 클릭');
}

// ── QUEUE ──
async function doQueue(page) {
  await page.waitForURL('**#/queue', { timeout: 5000 });
  log('✅', 'QUEUE 진입');
  await page.waitForSelector('text=좌석 선택으로 이동', { timeout: 30000 });
  await page.click('text=좌석 선택으로 이동');
  log('✅', 'QUEUE 통과');
}

// ── CAPTCHA ──
async function doCaptcha(page) {
  await page.waitForURL('**#/captcha', { timeout: 5000 });
  const code = await page.evaluate(() =>
    [...document.querySelectorAll('span')]
      .filter(s => s.className.includes('text-3xl') && /^[A-Z]$/.test(s.textContent.trim()))
      .map(s => s.textContent.trim()).join('')
  );
  if (code.length !== 6) throw new Error(`CAPTCHA 파싱 실패: "${code}"`);
  await page.fill('input', code);
  await page.keyboard.press('Enter');
  log('✅', `CAPTCHA 통과 (${code})`);
}

// ══════════════════════════════════════════
// TEST 1: 정상 플로우 — VIP 진입 시도
// ══════════════════════════════════════════
console.log('\n━━━ TEST 1: 정상 플로우 (VIP 시도) ━━━');
{
  const { browser, page } = await newPage();
  try {
    await doSetting(page);
    await doReady(page);
    await doQueue(page);
    await doCaptcha(page);

    await page.waitForURL('**#/zone', { timeout: 5000 });
    log('✅', 'ZONE 페이지 진입');

    await wait(800);
    const floor2Num = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('2층'));
      return parseInt(btn?.textContent.match(/(\d+)\s*석 남음/)?.[1] ?? '120');
    });
    log(floor2Num < 120 ? '✅' : '⚠️', `ZONE 진입 0.8초 후 floor2 잔여: ${floor2Num}/120`);

    const vipDisabled = await page.evaluate(() =>
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('VIP'))?.disabled ?? true
    );

    if (!vipDisabled) {
      await page.locator('button').filter({ hasText: 'VIP' }).first().click();
      await page.waitForURL('**#/seat', { timeout: 5000 });
      log('✅', 'VIP Seat 진입');
      const initCount = await page.locator('button.bg-\\[\\#7C3AED\\]').count();
      log('✅', `VIP 잔여: ${initCount}석`);

      let gotResult = false;
      for (let i = 0; i < 15 && !gotResult; i++) {
        await wait(300);
        if (page.url().includes('result')) { gotResult = true; break; }
        if (page.url().includes('zone')) { log('⚠️', 'VIP 매진 → Zone 자동 복귀'); break; }
        const avail = await page.locator('button.bg-\\[\\#7C3AED\\]').count();
        if (avail === 0) { log('⚠️', '좌석 전부 소진'); break; }
        await page.locator('button.bg-\\[\\#7C3AED\\]').first().click();
        await wait(400);
        const modal = await page.locator('text=이미 선택된 좌석').isVisible().catch(() => false);
        if (modal) {
          log('🔍', `이선좌 발생 (${i + 1}번째)`);
          await page.keyboard.press('Enter');
        } else {
          gotResult = true;
        }
      }

      await wait(600);
      if (page.url().includes('result')) {
        const isSuccess = await page.locator('text=예매 성공').isVisible().catch(() => false);
        const rank = await page.evaluate(() =>
          [...document.querySelectorAll('*')].find(e => !e.children.length && /[SABF]등급/.test(e.textContent))?.textContent ?? 'N/A'
        );
        log('✅', `RESULT — ${isSuccess ? '성공' : '실패'} / ${rank}`);
      }
    } else {
      log('⚠️', 'VIP 이미 매진 상태 (봇이 빠름)');
    }
  } catch (e) { log('❌', e.message); }
  await browser.close();
}

// ══════════════════════════════════════════
// TEST 2: VIP 매진 후 floor2 이동 + 리셋 버그 검증
// ══════════════════════════════════════════
console.log('\n━━━ TEST 2: VIP 매진 후 floor2 + 리셋 버그 ━━━');
{
  const { browser, page } = await newPage();
  try {
    await doSetting(page);
    await doReady(page);
    await doQueue(page);
    await doCaptcha(page);
    await page.waitForURL('**#/zone', { timeout: 5000 });

    // VIP 매진 대기 (최대 10초)
    const vipSoldOut = await page.waitForFunction(() =>
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('VIP'))?.textContent.includes('매진')
    , { timeout: 10000 }).then(() => true).catch(() => false);
    log(vipSoldOut ? '✅' : '⚠️', `VIP 매진 감지: ${vipSoldOut}`);

    const floor2Num = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('2층'));
      return parseInt(btn?.textContent.match(/(\d+)\s*석 남음/)?.[1] ?? '120');
    });
    log(floor2Num < 120 ? '✅' : '❌',
      `VIP 매진 직후 floor2: ${floor2Num}/120 → ${floor2Num < 120 ? '리셋 없음 ✓' : '리셋 버그!'}`);

    const f2Disabled = await page.evaluate(() =>
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('2층'))?.disabled ?? true
    );

    if (!f2Disabled) {
      await page.locator('button').filter({ hasText: '2층' }).first().click();
      await page.waitForURL('**#/seat', { timeout: 5000 });
      const cnt = await page.locator('button.bg-\\[\\#7C3AED\\]').count();
      log('✅', `floor2 Seat 진입, 선택 가능: ${cnt}석`);

      await page.goBack();
      await page.waitForURL('**#/zone', { timeout: 5000 });
      const floor2After = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('2층'));
        return parseInt(btn?.textContent.match(/(\d+)\s*석 남음/)?.[1] ?? '120');
      });
      log(floor2After < 120 ? '✅' : '❌',
        `Zone 재진입 후 floor2: ${floor2After}/120 → ${floor2After < 120 ? '상태 유지 ✓' : '리셋!'}`);
    } else {
      log('⚠️', 'floor2 아직 잠금 상태');
    }
  } catch (e) { log('❌', e.message); }
  await browser.close();
}

// ══════════════════════════════════════════
// TEST 3: CAPTCHA 타임아웃
// ══════════════════════════════════════════
console.log('\n━━━ TEST 3: CAPTCHA 타임아웃 ━━━');
{
  const { browser, page } = await newPage();
  try {
    await doSetting(page);
    await doReady(page);
    await doQueue(page);
    await page.waitForURL('**#/captcha', { timeout: 5000 });
    log('✅', 'CAPTCHA 진입 (입력 안 함)');
    await wait(6500);
    const onResult = page.url().includes('result');
    log(onResult ? '✅' : '❌', `타임아웃 후 RESULT 이동: ${onResult}`);
    if (onResult) {
      const isFail = await page.locator('text=예매 실패').isVisible().catch(() => false);
      log(isFail ? '✅' : '⚠️', `실패 결과 표시: ${isFail}`);
      const rank = await page.evaluate(() =>
        [...document.querySelectorAll('*')].find(e => !e.children.length && /[SABF]등급/.test(e.textContent))?.textContent ?? 'N/A'
      );
      log('✅', `등급: ${rank}`);
    }
  } catch (e) { log('❌', e.message); }
  await browser.close();
}

// ══════════════════════════════════════════
// TEST 4: F5 패널티 (QUEUE 구간)
// ══════════════════════════════════════════
console.log('\n━━━ TEST 4: F5 패널티 (QUEUE 구간) ━━━');
{
  const { browser, page } = await newPage();
  try {
    await doSetting(page);
    await doReady(page);
    await page.waitForURL('**#/queue', { timeout: 5000 });
    log('✅', 'QUEUE 진입');

    await page.keyboard.press('F5');
    await wait(400);

    const overlay = await page.evaluate(() =>
      !!document.querySelector('.fixed.inset-0')
    );
    log(overlay ? '✅' : '⚠️', `F5 흰 화면 오버레이: ${overlay ? '표시됨' : '없음'}`);

    await wait(2200);
    const stillQueue = page.url().includes('queue');
    log(stillQueue ? '✅' : '❌', `F5 후 QUEUE 유지: ${stillQueue}`);
  } catch (e) { log('❌', e.message); }
  await browser.close();
}

console.log('\n━━━ 전체 테스트 완료 ━━━\n');
