// Usage: node shot.js <html> <outdir> [script]
// Opens the built app in Chrome, collects console errors, runs a list of actions and takes screenshots.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const [, , html, outdir, scriptName = 'basic'] = process.argv;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,940', '--allow-file-access-from-files'],
    defaultViewport: { width: 1600, height: 940 },
  });
  const page = await browser.newPage();
  if (process.env.VW) await page.setViewport({ width: +process.env.VW, height: +process.env.VH, deviceScaleFactor: 2, isMobile: process.env.MOBILE === '1', hasTouch: process.env.MOBILE === '1' });
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
  await page.goto('file:///' + path.resolve(html).replace(/\\/g, '/'), { waitUntil: 'load', timeout: 120000 });
  await new Promise(r => setTimeout(r, 6000));
  const shot = async (name) => { await page.screenshot({ path: path.join(outdir, name + '.png') }); console.log('shot', name); };
  const ev = (code) => page.evaluate(code);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const scripts = {
    async basic() {
      await shot('01_home');
      await ev(`app.view('top', 0)`); await wait(800); await shot('02_top');
      await ev(`app.view('bottom', 0)`); await wait(800); await shot('03_bottom');
      await ev(`app.view('home', 0); app.select('soc')`); await wait(1800); await shot('04_soc');
      await ev(`app.select('usbc')`); await wait(1800); await shot('05_usbc');
      await ev(`app.select('pin:D5')`); await wait(1800); await shot('06_pinD5');
    },
    async closeups() {
      const pos = JSON.parse(process.env.CAMS || '[]');
      for (const [i, c] of pos.entries()) {
        await ev(`(()=>{const v=app.viewer; v.controls.target.set(${c.t}); v.camera.position.set(${c.p}); v.controls.update();})()`);
        await wait(900); await shot('c' + i);
      }
    },
    async interact() {
      // click on parts through real mouse events (projected screen position)
      const proj = async (id) => ev(`(()=>{const c=app.board.partCenter('${id}').center.clone(); if('${id}'.startsWith('pin:')) c.copy(app.board.pins['${id}'.slice(4)].pos); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await ev(`app.view('home', 0)`); await wait(800);
      for (const id of ['soc', 'wifi', 'qwiic', 'pin:A0', 'matrix', 'rgb3']) {
        await ev(`app.view('home', 0)`); await wait(500);
        const [x, y] = await proj(id);
        await page.mouse.move(x, y); await wait(300);
        await page.mouse.click(x, y); await wait(1500);
        const title = await ev(`document.querySelector('#panel h2') && document.querySelector('#panel h2').textContent`);
        console.log('click', id, '->', title);
      }
      await shot('i_click_last');
      await ev(`app.setMode('lessons'); app.startLesson('l1')`); await wait(1500);
      await ev(`app.goStep(2)`); await wait(2500); await shot('l1_mcu_bottom');
      await ev(`app.goStep(8)`); await wait(2500); await shot('l1_headers');
      await ev(`app.goStep(12)`); await wait(2500); await shot('l1_bottomconn');
      await ev(`app.view('bottom', 0)`); await wait(1200); await shot('bottom_view');
      await ev(`app.startLesson('l2'); app.goStep(3)`); await wait(2500); await shot('l2_tree');
      await ev(`app.startLesson('l3'); app.goStep(5)`); await wait(4200); await shot('l3_slider');
      await ev(`app.startLesson('l4'); app.goStep(7)`); await wait(5000); await shot('l4_trace');
      await ev(`app.goStep(10); app.showQuiz()`); await wait(1000);
      await page.click('.opt[data-q="0"][data-a="1"]'); await page.click('.opt[data-q="1"][data-a="0"]'); await wait(300); await shot('l4_quiz');
    },
    async stage2() {
      await ev(`app.setMode('lessons'); app.startLesson('l5')`); await wait(2500); await shot('s5_0');
      for (const k of [3,4,5]) { await ev(`app.goStep(${k})`); await wait(k===3?3500:3000); }
      await shot('s5_wired');
      await ev(`app.goStep(7)`); await wait(5000);
      await ev(`app.pressButton(true)`); await wait(2600); await shot('s5_pressed');
      console.log('serial5', await ev(`document.querySelector('#serial').innerText.slice(-200)`));
      await ev(`app.pressButton(false)`);
      await ev(`app.startLesson('l6')`); await wait(2000);
      for (const k of [1,2,3,4,5]) { await ev(`app.goStep(${k})`); await wait(k>=4?4500:600); }
      await shot('s6_wired');
      await ev(`app.goStep(7)`); await wait(4000); await ev(`app.setKnob(0.75)`); await wait(1500); await shot('s6_run');
      console.log('serial6', await ev(`document.querySelector('#serial').innerText.slice(-80)`));
      await ev(`app.startLesson('l7')`); await wait(2000); await ev(`app.goStep(3)`); await wait(4000); await shot('s7_try');
      await ev(`app.goStep(5)`); await wait(2500); await shot('s7_run');
      await ev(`app.startLesson('l8')`); await wait(2000); await ev(`app.goStep(1)`); await wait(7000);
      await ev(`app.goStep(5)`); await wait(4000); await ev(`app.setKnob(0.3)`); await wait(1000); await shot('s8_run');
      console.log('serial8', await ev(`document.querySelector('#serial').innerText.slice(-60)`));
      await ev(`app.startLesson('l9')`); await wait(4000); await ev(`app.goStep(1)`); await wait(2500); await shot('s9_axes');
      await ev(`app.goStep(2)`); await wait(2500); await shot('s9_logo');
      await ev(`app.goStep(3)`); await wait(2500); await shot('s9_shades');
      await ev(`app.goStep(4)`); await wait(2500);
      await page.click('.lvl[data-act="clear"]'); for (const i of [0,14,28,42,56,70,84,12,24,36,48,60,72]) await page.click(`.px[data-i="${i}"]`);
      await wait(800); await shot('s9_editor');
      await ev(`app.startLesson('l10')`); await wait(2000);
      for (const k of [1,2,3,4,5,6]) { await ev(`app.goStep(${k})`); await wait(k>=4?4000:500); }
      await shot('s10_wired');
      await ev(`app.goStep(8)`); await wait(5500); await shot('s10_run');
      await ev(`app.view('breadboard', 0)`); await wait(1200); await shot('s10_close');
    },
    async direct() {
      const projItem = async (id, dy = 0) => ev(`(()=>{const g=app.bench.items['${id}'].group; const b=new (g.position.constructor)(); const c=g.position.clone(); c.y+=${dy}; c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await ev(`app.setMode('lessons'); app.startLesson('l5')`); await wait(2000);
      await ev(`app.goStep(7)`); await wait(6000);
      await ev(`app.view('breadboard', 0)`); await wait(800);
      let [x, y] = await projItem('btn1', 5);
      await page.mouse.move(x, y); await page.mouse.down(); await wait(2600);
      console.log('button pressed (3D):', await ev(`app.buttonDown`), '| serial:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0]);
      await shot('d5_press3d');
      await page.mouse.up(); await wait(300); console.log('after release:', await ev(`app.buttonDown`));
      await ev(`app.startLesson('l6')`); await wait(1500); await ev(`app.goStep(7)`); await wait(9000);
      await ev(`app.view('breadboard', 0)`); await wait(800);
      [x, y] = await projItem('pot1', 9);
      const before = await ev(`app.knobValue()`);
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y, { steps: 6 }); await page.mouse.up(); await wait(700);
      console.log('knob before', before.toFixed(3), 'after drag', (await ev(`app.knobValue()`)).toFixed(3));
      await shot('d6_knob');
    },
    async verify() {
      await ev(`app.setMode('lessons'); app.startLesson('l4')`); await wait(1500);
      await ev(`app.goStep(9)`); await wait(6000);
      // which header pin is each wire end closest to?
      const r = await ev(`(()=>{const out=[]; for (const [id,it] of Object.entries(app.bench.items)) { if (it.def.type!=='wire') continue;
        for (const e of [it.obj.endA, it.obj.endB]) { let best=null,bd=1e9; for (const [pid,p] of Object.entries(app.board.pins)) { const d=p.pos.distanceTo(e.position); if (d<bd){bd=d;best=pid;} }
          out.push(id+': '+(bd<0.5?best:'(breadboard)')+' d='+bd.toFixed(2)); } } return out; })()`);
      console.log(r.join(String.fromCharCode(10)));
      await ev(`(()=>{const v=app.viewer; const p=app.board.pins.GND2.pos; v.controls.target.set(p.x, 4, p.z); v.camera.position.set(p.x+4, 30, p.z-30); v.controls.update();})()`);
      await wait(1200); await shot('v_janalog_inner');
      await ev(`(()=>{const v=app.viewer; const p=app.board.pins.GND2.pos; v.controls.target.set(p.x, 4, p.z); v.camera.position.set(p.x+4, 22, p.z+34); v.controls.update();})()`);
      await wait(1200); await shot('v_janalog_outer');
    },
    async headers() {
      const cam = async (tx, tz, px, py, pz, name) => { await ev(`(()=>{const v=app.viewer; v.controls.target.set(${tx}, 4, ${tz}); v.camera.position.set(${px}, ${py}, ${pz}); v.controls.update();})()`); await wait(1200); await shot(name); };
      await ev(`app.setMode('lessons'); app.startLesson('l4')`); await wait(1500);
      await ev(`app.goStep(9)`); await wait(6000);
      await ev(`app.markPins(['GND2','GND3','5V','RESET','VIN'])`); await wait(300);
      // JANALOG outer face (world z ≈ +24), seen from the breadboard side
      await cam(4, 24, 4, 26, 70, 'h_janalog_left');
      await cam(25, 24, 25, 26, 70, 'h_janalog_right');
      await ev(`app.clearTemp(); app.markPins(['D5','GND1','D13','D0','D4'])`);
      // JDIGITAL inner face (world z ≈ -24), seen from the board centre
      await cam(-6, -24, -6, 30, 26, 'h_jdig_left');
      await cam(18, -24, 18, 30, 26, 'h_jdig_right');
      await ev(`app.clearTemp()`);
      await ev(`app.view('bench', 0)`); await wait(1200); await shot('h_bench');
      await ev(`app.startLesson('l10'); app.goStep(9)`); await wait(5000); await ev(`app.view('breadboard', 0)`); await wait(1200); await shot('h_buzzer');
    },
    async m4() {
      const cam = async (tx, ty, tz, px, py, pz, name) => { await ev(`(()=>{const v=app.viewer; v.controls.target.set(${tx}, ${ty}, ${tz}); v.camera.position.set(${px}, ${py}, ${pz}); v.controls.update();})()`); await wait(1100); await shot(name); };
      // realism close-ups
      await cam(-23, 1, 13, -30, 34, 40, 'r_wifi');
      await cam(0, 1, -13, -6, 30, 12, 'r_dram');
      await cam(-18, 1, -10, -24, 18, 6, 'r_anx');
      await ev(`app.setMode('lessons'); app.startLesson('l11')`); await wait(1500);
      for (const k of [1,2,3,4,5]) { await ev(`app.goStep(${k})`); await wait(k>=3?3500:500); }
      await shot('m11_wired');
      await ev(`app.view('breadboard', 0)`); await wait(900); await shot('m11_close');
      await ev(`app.goStep(7)`); await wait(5500);
      await ev(`app.setLux(300)`); await wait(1500); await shot('m11_bright');
      console.log('L11 bright:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0], '| led', await ev(`document.querySelector('#pinlevel').innerText`));
      await ev(`app.setLux(0.5)`); await wait(1500); await shot('m11_dark');
      console.log('L11 dark:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0], '| led', await ev(`document.querySelector('#pinlevel').innerText`));
      await ev(`app.startLesson('l12')`); await wait(1500);
      for (const k of [4,5]) { await ev(`app.goStep(${k})`); await wait(4500); }
      await shot('m12_wired');
      await ev(`app.view('breadboard', 0)`); await wait(900); await shot('m12_close');
      await cam(-21, 2, 64, -21, 14, 92, 'm12_face');
      await ev(`app.goStep(8)`); await wait(4000); await ev(`app.setTemp(31.5)`); await wait(2600); await shot('m12_run');
      console.log('L12:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0]);
      await ev(`app.select('tmp36')`); await wait(500);
    },
    async tmpface() {
      await ev(`app.setMode('lessons'); app.startLesson('l12')`); await wait(1500);
      await ev(`app.goStep(5)`); await wait(5000);
      const r = await ev(`(()=>{const h=app.bb.hole('e',19); const g=app.bench.items.t1.group; return [h.x,h.y,h.z,g.position.x,g.position.z]})()`);
      console.log('hole e19', r.map(v=>v.toFixed(2)).join(' '));
      await ev(`app.markPins([]); app.holeLabels(['e18 · +VS','e19 · VOUT','e20 · GND'])`);
      await ev(`(()=>{const v=app.viewer; const h=app.bb.hole('e',19); v.controls.target.set(h.x, h.y+4, h.z); v.camera.position.set(h.x+3, h.y+12, h.z+26); v.controls.update();})()`);
      await wait(1200); await shot('t_face');
      await ev(`(()=>{const v=app.viewer; const h=app.bb.hole('e',22); v.controls.target.set(h.x, h.y+3, h.z); v.camera.position.set(h.x+2, h.y+26, h.z+16); v.controls.update();})()`);
      await ev(`app.startLesson('l11')`); await wait(1200); await ev(`app.goStep(5)`); await wait(6000);
      await ev(`(()=>{const v=app.viewer; const h=app.bb.hole('e',22); v.controls.target.set(h.x+1.3, h.y+3, h.z); v.camera.position.set(h.x+3, h.y+24, h.z+14); v.controls.update();})()`);
      await wait(1200); await shot('t_ldr');
    },
    async ledvis() {
      const cam = async (tx, ty, tz, px, py, pz, name) => { await ev(`(()=>{const v=app.viewer; v.controls.target.set(${tx}, ${ty}, ${tz}); v.camera.position.set(${px}, ${py}, ${pz}); v.controls.update();})()`); await wait(1100); await shot(name); };
      await ev(`app.setMode('lessons'); app.startLesson('l9')`); await wait(2500);
      await ev(`app.goStep(2)`); await wait(3500);
      await cam(10.5, 0, 14, 10.5, 60, 52, 'lv_logo');
      await cam(10.5, 0, 14, -30, 40, 50, 'lv_logo_angle');
      await ev(`app.goStep(3)`); await wait(3000);
      await cam(10.5, 0, 14, 10.5, 60, 52, 'lv_shades');
      await ev(`app.view('home', 0)`); await wait(800); await shot('lv_home');
      await ev(`app.startLesson('l3'); app.goStep(3)`); await wait(4000);
      for (let k = 0; k < 10; k++) { const on = await ev(`app.board.leds.rgb3.rgb[0]`); if (on) break; await wait(250); }
      await cam(30.7, 0, -19.3, 18, 36, 6, 'lv_rgb3');
    },
    async rgbvis() {
      const cam = async (tx, ty, tz, px, py, pz, name) => { await ev(`(()=>{const v=app.viewer; v.controls.target.set(${tx}, ${ty}, ${tz}); v.camera.position.set(${px}, ${py}, ${pz}); v.controls.update();})()`); await wait(1100); await shot(name); };
      await ev(`app.board.setPowerLed(true); app.board.setLed('rgb3',1,0,0); app.board.setLed('rgb4',0,1,0); app.board.setLed('rgb1',0,0,1); app.board.setLed('rgb2',1,1,1)`);
      await cam(30.7, 0, -19.3, 18, 36, 6, 'rv_rgb');
      await cam(-32, 0, -4.5, -45, 30, 20, 'rv_pwr');
      await ev(`app.view('home', 0)`); await wait(800); await shot('rv_home');
    },
    async l13() {
      await ev(`app.setMode('lessons'); app.startLesson('l13')`); await wait(1500);
      for (const k of [1,2,3,4]) { await ev(`app.goStep(${k})`); await wait(k>=3?4500:600); }
      await shot('u_wired');
      await ev(`app.goStep(3)`); await wait(3000); await ev(`app.view('breadboard', 0)`); await wait(900); await shot('u_close');
      await ev(`app.goStep(7)`); await wait(6000); await ev(`app.setDist(23.4)`); await wait(2500); await shot('u_run');
      console.log('L13 23.4cm:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0]);
      await ev(`app.setDist(137.5)`); await wait(1500);
      console.log('L13 137.5cm:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0]);
      await ev(`(()=>{const v=app.viewer; const g=app.bench.items.us1.group.position; v.controls.target.set(g.x, 14, g.z+20); v.camera.position.set(g.x-25, 45, g.z+90); v.controls.update();})()`);
      await ev(`app.setDist(20)`); await wait(1200); await shot('u_front');
      await ev(`app.setDist(8)`); await ev(`app.view('sonar', 0)`); await wait(1200); await shot('u_bench');
    },
    async sonar2() {
      await ev(`app.setMode('lessons'); app.startLesson('l13')`); await wait(1500);
      await ev(`app.goStep(7)`); await wait(7000);
      await ev(`app.setDist(100)`); await wait(300);
      // catch the animation: wait for a burst start, then shoot outgoing and returning phases
      for (let k = 0; k < 40; k++) { const t = await ev(`app.waves.anim ? performance.now() - app.waves.anim.t0 : -1`); if (t >= 0 && t < 40) break; await wait(15); }
      const tOut = await ev(`app.waves.anim ? app.waves.anim.tOut : 300`);
      await wait(60 + tOut * 0.55); await shot('w_out');
      await wait(tOut * 0.8); await shot('w_back');
      // drag the obstacle with the mouse
      const before = await ev(`app.distCm`);
      const [x, y] = await ev(`(()=>{const c=app.obstacle.position.clone(); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 120, y - 60, { steps: 8 }); await page.mouse.up(); await wait(800);
      console.log('drag: before', before, 'after', (await ev(`app.distCm`)).toFixed(1), '| label', await ev(`app.obstacleLabel.element.textContent`));
      await shot('w_dragged');
      // click the Wi-Fi module during the lesson -> compact callout
      await ev(`app.view('bench', 0)`); await wait(800);
      const [cx, cy] = await ev(`(()=>{const c=app.board.partCenter('wifi').center.clone(); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await page.mouse.click(cx, cy); await wait(1600);
      console.log('callout visible:', await ev(`document.querySelector('#callout-overlay').style.display`), '| float card:', await ev(`document.querySelector('#float-card').style.display`));
      await shot('w_callout');
      // click the HC-SR04 itself
      await page.click('#callout-close'); await wait(1400); await ev(`app.view('sonar', 0)`); await wait(800);
      const [hx, hy] = await ev(`(()=>{const c=app.bench.items.us1.group.position.clone(); c.y+=14; c.z+=10; c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await page.mouse.click(hx, hy); await wait(1600); await shot('w_callout_hw');
      await page.click('#callout-close'); await wait(1400);
      console.log('after close callout:', await ev(`document.querySelector('#callout-overlay').style.display`));
      await shot('w_closed');
    },
    async mcheck() {
      await ev(`app.view('home', 0)`); await wait(600);
      await ev(`app.select('pin:A0')`); await wait(1500); await ev(`app.view('home', 0)`); await wait(600);
      const [x, y] = await ev(`(()=>{const c=app.board.partCenter('matrix').center.clone(); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      const topEl = await ev(`(()=>{const e=document.elementFromPoint(${x}, ${y}); return e.id + ' ' + e.className})()`);
      console.log('element at matrix point:', topEl);
      await shot('mc');
    },
    async real13() {
      await ev(`app.setMode('lessons'); app.startLesson('l13')`); await wait(1500);
      await ev(`app.goStep(7)`); await wait(7000);
      await ev(`app.setDist(30, true)`); await wait(1500);
      const catchAt = async (frac, name) => {
        for (let k = 0; k < 200; k++) { const t = await ev(`app.waves.anim ? (performance.now() - app.waves.anim.t0) / (app.waves.anim.trig + app.waves.anim.hear) : -1`); if (t >= 0 && t < 0.05) break; await wait(10); }
        const T = await ev(`app.waves.anim.trig + app.waves.anim.hear`); await wait(T * frac); await shot(name);
      };
      await catchAt(0.3, 'r_out'); await catchAt(0.8, 'r_back');
      console.log('serial:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0]);
      // close-up of the module
      await ev(`(()=>{const v=app.viewer; const g=app.bench.items.us1.group.position; v.controls.target.set(g.x, g.y+13, g.z+6); v.camera.position.set(g.x, g.y+16, g.z+95); v.controls.update();})()`);
      await wait(1200); await shot('r_module');
      await ev(`(()=>{const v=app.viewer; const g=app.bench.items.us1.group.position; v.controls.target.set(g.x, g.y+13, g.z); v.camera.position.set(g.x+30, g.y+30, g.z-70); v.controls.update();})()`);
      await wait(1200); await shot('r_back_side');
      await ev(`app.setDist(150, true)`); await wait(2500); await catchAt(0.55, 'r_far');
      // drag the box
      await ev(`app.setDist(40, true)`); await wait(2000);
      const before = await ev(`app.distCm`);
      const [x, y] = await ev(`(()=>{const c=app.obstacle.position.clone(); c.y+=40; c.z-=90; c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      console.log('drag pick', await ev(`(()=>{const h=app.viewer.pick({clientX:${x},clientY:${y}}); return h? h.id : 'none'})()`));
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 140, y, { steps: 10 }); await page.mouse.up(); await wait(600);
      console.log('drag', before, '->', (await ev(`app.distCm`)).toFixed(1));
      await shot('r_dragged');
    },
    async dragdbg() {
      await ev(`app.setMode('lessons'); app.startLesson('l13')`); await wait(1500);
      await ev(`app.goStep(7)`); await wait(7000);
      await ev(`app.setDist(40, true)`); await wait(2000);
      const [x, y] = await ev(`(()=>{const c=app.obstacle.position.clone(); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      console.log('pt', x, y, await ev(`(()=>{const e=document.elementFromPoint(${x},${y}); return e.tagName+' '+e.className+' '+e.id})()`));
      console.log('pick', await ev(`(()=>{const h=app.viewer.pick({clientX:${x},clientY:${y}}); return h? h.id : 'none'})()`));
      console.log('targets', await ev(`app.viewer.pickTargets.length + ' incl obstacle ' + app.viewer.pickTargets.includes(app.obstacle)`));
    },
    async drag2() {
      await ev(`app.setMode('lessons'); app.startLesson('l13')`); await wait(1500);
      await ev(`app.goStep(7)`); await wait(7000);
      await ev(`app.setDist(40, true)`); await wait(2500);
      const pts = await ev(`(()=>{const out=[]; const r=app.viewer.renderer.domElement.getBoundingClientRect(); for (const [dx,dy,dz] of [[0,0,-90],[130,0,0],[0,40,-90],[60,20,-90]]) { const c=app.obstacle.position.clone(); c.x+=dx; c.y+=dy; c.z+=dz; c.project(app.viewer.camera); const x=r.left+(c.x+1)/2*r.width, y=r.top+(1-c.y)/2*r.height; const h=app.viewer.pick({clientX:x,clientY:y}); const el=document.elementFromPoint(x,y); out.push([x|0,y|0,h?h.id:'none', el.tagName+'.'+el.className]); } return out; })()`);
      console.log(JSON.stringify(pts));
      const [x,y] = pts.find(p => p[2]==='obstacle' && p[3].startsWith('CANVAS')) || pts[0];
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 140, y, { steps: 10 }); await page.mouse.up(); await wait(500);
      console.log('after', await ev(`app.distCm`));
    },
    async l14() {
      await ev(`app.setMode('lessons'); app.startLesson('l14')`); await wait(1500);
      await ev(`app.goStep(4)`); await wait(3500);
      await ev(`app.goStep(5)`); await wait(6500); await shot('p_wired');
      await ev(`(()=>{const v=app.viewer; const g=app.bench.items.pir1.group.position; v.controls.target.set(g.x, 25, g.z); v.camera.position.set(g.x+45, 70, g.z+110); v.controls.update();})()`); await wait(1200); await shot('p_front');
      await ev(`(()=>{const v=app.viewer; const g=app.bench.items.pir1.group.position; v.controls.target.set(g.x, 25, g.z); v.camera.position.set(g.x+60, 70, g.z-90); v.controls.update();})()`); await wait(1200); await shot('p_back');
      await ev(`app.goStep(7)`); await wait(4000); await shot('p_warm');
      await wait(9000); await shot('p_room');
      console.log('serial:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-3).join(' | '));
      console.log('state:', await ev(`document.querySelector('#pir-state').innerText`));
      await ev(`document.querySelector('[data-pmode="still"]').click()`); await wait(8000);
      console.log('after still:', await ev(`document.querySelector('#pir-state').innerText`), '|', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-1)[0]);
      await shot('p_still');
    },
    async l14b() {
      const proj = async code => ev(`(()=>{const c=(${code}); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await ev(`app.setMode('lessons'); app.startLesson('l14')`); await wait(2500); await shot('q_intro');
      await ev(`app.goStep(4)`); await wait(3500); await ev(`app.goStep(5)`); await wait(6500);
      await ev(`app.goStep(6)`); await wait(2500); await shot('q_front');
      let [x, y] = await proj(`app.pirLens().clone().add(new (app.pirLens().constructor)(3, 4, -2))`);
      await page.mouse.click(x, y); await wait(1600);
      console.log('click lens ->', await ev(`document.querySelector('#callout-title').textContent`)); await shot('q_lens');
      await page.click('#callout-close'); await wait(800);
      await ev(`app.goStep(7)`); await wait(2500); await shot('q_back');
      for (const [name, code] of [['delay pot', `app.bench.items.pir1.group.localToWorld(new (app.pirLens().constructor)(5, 37.5, -4.4))`], ['sens pot', `app.bench.items.pir1.group.localToWorld(new (app.pirLens().constructor)(-4, 37.5, -4.4))`], ['jumper', `app.bench.items.pir1.group.localToWorld(new (app.pirLens().constructor)(-13.2, 36.3, -5.4))`], ['chip', `app.bench.items.pir1.group.localToWorld(new (app.pirLens().constructor)(-8, 31, -2.4))`]]) {
        [x, y] = await proj(code); await page.mouse.click(x, y); await wait(1300);
        console.log('click', name, '->', await ev(`document.querySelector('#callout-title').textContent`));
        if (name === 'delay pot') await shot('q_pot');
        await ev(`document.querySelector('#callout-close').click()`); await wait(1300); await ev(`app.goStep(7)`); await wait(1500);
      }
      await ev(`app.goStep(9)`); await wait(4000); await shot('q_warm'); await wait(8000); await shot('q_run');
      console.log('serial:', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-2).join(' | '));
      console.log('state:', await ev(`document.querySelector('#pir-state').innerText`));
    },
    async l14c() {
      const st = async () => ev(`['#ps-sensor','#ps-out','#ps-led'].map(q=>document.querySelector(q).textContent).join(' → ') + ' | ' + document.querySelector('#ps-note').innerText + ' | tags: ' + app.pirTags.map(t=>t.element.textContent).join(' / ')`);
      await ev(`app.setMode('lessons'); app.startLesson('l14')`); await wait(1500);
      await ev(`app.goStep(8)`); await wait(1800); await shot('s_warm');
      console.log('warm   :', await st());
      await wait(4000); console.log('ready  :', await st()); await shot('s_ready');
      await page.click('#pir-wave'); await wait(900); await shot('s_wave');
      console.log('wave   :', await st());
      await wait(2000); console.log('after  :', await st()); await shot('s_on');
      await wait(5500); console.log('later  :', await st()); await shot('s_off');
      await page.click('#pir-still'); await wait(3000); console.log('still  :', await st()); await shot('s_still');
      console.log('serial :', (await ev(`document.querySelector('#serial').innerText`)).trim().split(String.fromCharCode(10)).slice(-4).join(' | '));
    },
    async l15() {
      const st = async () => ev(`['#sv-cmd','#sv-us','#sv-ang'].map(q=>document.querySelector(q).textContent).join(' → ') + ' | scope: ' + document.querySelector('#scope-info').textContent`);
      await ev(`app.setMode('lessons'); app.startLesson('l15')`); await wait(2500); await shot('v_intro');
      await ev(`app.goStep(3)`); await wait(4500); await ev(`app.goStep(4)`); await wait(6000); await shot('v_wired');
      await ev(`app.goStep(5)`); await wait(2200); await shot('v_close');
      const [x, y] = await ev(`(()=>{const c=app.servoObj().hornTip(); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await page.mouse.click(x, y); await wait(1500); console.log('click horn ->', await ev(`document.querySelector('#callout-title').textContent`)); await shot('v_horn');
      await ev(`document.querySelector('#callout-close').click()`); await wait(800);
      await ev(`app.goStep(7)`); await wait(3500);
      for (let k = 0; k < 4; k++) { console.log('t' + k + ':', await st()); await wait(1000); }
      await shot('v_run');
    },
    async l16() {
      const st = async () => ev(`['#mt-in1','#mt-in2','#mt-en','#mt-mot'].map(q=>document.querySelector(q).textContent).join(' | ') + ' | row: ' + ([...document.querySelectorAll('.mtable tr.hit')].map(r=>r.dataset.r).join(',')||'-') + ' | speed ' + app.bench.get('mot1').speed.toFixed(2)`);
      await ev(`app.setMode('lessons'); app.startLesson('l16')`); await wait(3000); await shot('m_intro');
      await ev(`app.goStep(4)`); await wait(3000); await shot('m_chip');
      await ev(`app.goStep(5)`); await wait(7000); await ev(`app.goStep(6)`); await wait(7000); await shot('m_wired');
      await ev(`app.goStep(7)`); await wait(2000);
      const [x, y] = await ev(`(()=>{const c=app.bench.items.u1.group.localToWorld(new (app.bench.items.u1.group.position.constructor)(-8.89, 1.5, 3.81)); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await page.mouse.click(x, y); await wait(1500); console.log('click pin1 ->', await ev(`document.querySelector('#callout-title').textContent`)); await shot('m_pin1');
      await ev(`document.querySelector('#callout-close').click()`); await wait(800);
      await ev(`app.goStep(9)`); await wait(1500);
      for (const t of [1000, 2000, 2000, 1500, 2000, 1000]) { await wait(t); console.log(await st()); if (t===2000) await shot('m_run_' + Date.now()%1000); }
    },
    async l17() {
      const st = async () => ev(`['#rl-pin','#rl-rel','#rl-lamp'].map(q=>document.querySelector(q).textContent).join(' | ') + ' | row: ' + ([...document.querySelectorAll('.rtable tr.hit')].map(r=>r.dataset.r).join(',')||'-') + ' | t=' + app.bench.get('rel1').t.toFixed(2) + ' tags: ' + app.rlyTags.map(t=>t.element.textContent).join('/')`);
      await ev(`app.setMode('lessons'); app.startLesson('l17')`); await wait(3500); await shot('r_intro');
      await ev(`app.goStep(1)`); await wait(3500); await shot('r_inside_off');
      await page.click('#rl-manual'); await wait(1200); await shot('r_inside_on'); console.log('manual:', await st());
      await page.click('#rl-manual'); await wait(500);
      await ev(`app.goStep(2)`); await wait(2000); await shot('r_module');
      const [x, y] = await ev(`(()=>{const m=app.bench.items.rel1.group; const c=m.localToWorld(new (m.position.constructor)(-10.5, 7, 8.2)); c.project(app.viewer.camera); const r=app.viewer.renderer.domElement.getBoundingClientRect(); return [r.left+(c.x+1)/2*r.width, r.top+(1-c.y)/2*r.height];})()`);
      await page.mouse.click(x, y); await wait(1500); console.log('click opto ->', await ev(`document.querySelector('#callout-title').textContent`)); await shot('r_opto');
      await ev(`document.querySelector('#callout-close').click()`); await wait(600);
      await ev(`app.goStep(5)`); await wait(4500); await ev(`app.goStep(6)`); await wait(6000); await ev(`app.goStep(7)`); await wait(7000); await shot('r_wired');
      await ev(`app.goStep(9)`); await wait(2500);
      for (const t of [900, 1800, 1500, 1500, 1500]) { await wait(t); console.log(await st()); }
      await shot('r_run');
    },
    async l17b() {
      await ev(`app.setMode('lessons'); app.startLesson('l17')`); await wait(2000);
      await ev(`app.goStep(9)`); await wait(2500); await ev(`app.sim.stop(); app.rly.manual = true`); await wait(1500);
      await ev(`app.view('relay', 0)`); await wait(900); await shot('r_on_wide');
      await ev(`(()=>{const v=app.viewer; const p=app.bench.items.lamp1.group.position; v.controls.target.set(p.x-20, 18, p.z); v.camera.position.set(p.x-60, 70, p.z+110); v.controls.update();})()`); await wait(900); await shot('r_on_lamp');
      await ev(`app.view('relayclose', 0)`); await wait(900); await shot('r_on_module');
    },
    async lessons() {
      await ev(`app.setMode('lessons'); app.startLesson('l2')`); await wait(2500); await shot('l2_s1');
      await ev(`app.goStep(1)`); await wait(4500); await shot('l2_s2');
      await ev(`app.startLesson('l3')`); await wait(1500);
      await ev(`app.goStep(3)`); await wait(5000); await shot('l3_run');
      await ev(`app.startLesson('l4')`); await wait(2500); await shot('l4_s1');
      await ev(`app.goStep(1)`); await wait(2000); await shot('l4_strips');
      await ev(`app.goStep(6)`); await wait(6000); await shot('l4_wired');
      await ev(`app.goStep(9)`); await wait(7000); await shot('l4_run');
      await ev(`app.view('breadboard', 0)`); await wait(1500); await shot('l4_closeup');
    },
    async thermo() {
      await ev(`app.setMode('lessons'); app.startLesson('l18')`); await wait(3000); await shot('t0_intro');
      await ev(`app.goStep(1)`); await wait(2500); await shot('t1_module');
      await ev(`app.goStep(5)`); await wait(6500); await shot('t5_plugged');
      await ev(`app.goStep(7)`); await wait(3000); await shot('t7_run');
      await wait(5000); await shot('t7_run2');
      await ev(`app.th.t=41.5; app.th.h=83; app.setThermo({})`); await wait(2500); await shot('t7_range');
      await ev(`app.goStep(8)`); await wait(2500);
      await ev(`app.th.unplug=true`); await wait(300);
      await ev(`app.goStep(8)`); await wait(1500);
      await ev(`document.querySelector('#run') && document.querySelector('#run').click()`); await wait(4000); await shot('t8_unplugged');
    },
    async thermoclick() {
      await ev(`app.setMode('lessons'); app.startLesson('l18')`); await wait(2500);
      await ev(`app.goStep(5)`); await wait(7000);
      for (const hw of ['th:sensor', 'th:qwiic', 'qwiiccable', 'th:led']) {
        await ev(`app.view('thermoclose', 0)`); await wait(1200);
        const xy2 = await ev(`(()=>{let m=null; app.viewer.scene.traverse(o=>{ if(!m && o.isMesh && o.userData.hw==='${hw}' && o.visible) m=o; }); m.updateWorldMatrix(true,false); m.geometry.computeBoundingBox(); const c=m.geometry.boundingBox.getCenter(new m.position.constructor()); m.localToWorld(c); c.project(app.viewer.camera); const r=document.querySelector('#stage').getBoundingClientRect(); return [(c.x+1)/2*r.width+r.left,(1-c.y)/2*r.height+r.top]; })()`);
        await page.mouse.click(xy2[0], xy2[1]); await wait(1200);
        console.log(hw, xy2, await ev(`document.querySelector('#callout') ? document.querySelector('#callout').innerText.slice(0,160) : 'no callout'`));
        await shot('k_' + hw.replace(/[:]/g, '_'));
      }
    },
    async pixels() {
      await ev(`app.setMode('lessons'); app.startLesson('l19')`); await wait(3000); await shot('p0_intro');
      await ev(`app.goStep(1)`); await wait(2500); await shot('p1_pixels');
      await ev(`app.goStep(5)`); await wait(9000); await shot('p5_chain');
      await ev(`app.goStep(8)`); await wait(6000); await shot('p8_run');
      await ev(`app.setThermo({t: 31})`); await wait(5000); await shot('p8_hot');
      await ev(`app.setThermo({t: 17})`); await wait(5000); await shot('p8_cold');
      await ev(`app.goStep(9)`); await wait(1500);
      await ev(`app.th.unplug=true`); await wait(300);
      await ev(`document.querySelector('#run') && document.querySelector('#run').click()`); await wait(4000); await shot('p9_cab2out');
    },
    async bridge() {
      await ev(`app.setMode('lessons'); app.startLesson('l20')`); await wait(3000); await shot('b0_soc');
      await ev(`app.goStep(1)`); await wait(3000); await shot('b1_mcu');
      await ev(`app.goStep(3)`); await wait(2500); await shot('b3_how');
      await ev(`app.goStep(7)`); await wait(3000); await shot('b7_py');
      await ev(`app.goStep(7)`); await wait(3500);
      await ev(`document.querySelector('#run') && document.querySelector('#run').click()`); await wait(2200); await shot('b9_run_a');
      await wait(2300); await shot('b9_run_b');
    },
    async bridge2() {
      await ev(`app.setMode('lessons'); app.startLesson('l21')`); await wait(3000); await shot('c0_intro');
      await ev(`app.goStep(4)`); await wait(6000);
      await ev(`document.querySelector('#run') && document.querySelector('#run').click()`); await wait(3500); await shot('c4_run_a');
      await ev(`app.setThermo({t: 31})`); await wait(6500); await shot('c4_hot');
      await ev(`app.setThermo({t: 24})`); await wait(6500); await shot('c4_cool');
    },
    async dash() {
      await ev(`app.setMode('lessons'); app.startLesson('l22')`); await wait(3000); await shot('d0_intro');
      await ev(`app.goStep(5)`); await wait(5500); await shot('d5_page');
      await ev(`app.goStep(6)`); await wait(5500);
      await ev(`document.querySelector('#run') && document.querySelector('#run').click()`); await wait(4000); await shot('d6_run_a');
      await ev(`app.setThermo({t: 31.5, h: 62})`); await wait(4500); await shot('d6_run_b');
      await ev(`app.goStep(7)`); await wait(3000); await shot('d7_open');
    },
    async home() {
      await ev(`app.setMode('lessons'); app.startLesson('l23')`); await wait(3000); await shot('h0_intro');
      await ev(`app.goStep(4)`); await wait(9000); await shot('h4_wired');
      await ev(`app.goStep(8)`); await wait(4000);
      await ev(`document.querySelector('#run') && document.querySelector('#run').click()`); await wait(3500); await shot('h8_run_a');
      await ev(`app.setThermo({t: 31})`); await wait(5000); await shot('h8_hot');
      await ev(`app.setThermo({t: 22.5})`); await wait(4500);
      await ev(`document.querySelector('#ph-mode').click()`); await wait(3000); await shot('h9_manual');
      await ev(`document.querySelector('#ph-lamp').click()`); await wait(4500); await shot('h9_lamp_on');
    },
    async resp() {
      const tag = process.env.TAG || 'x';
      await shot(tag + '_1_explore');
      await ev(`document.querySelector('#menu-btn') && getComputedStyle(document.querySelector('#menu-btn')).display !== 'none' && document.querySelector('#menu-btn').click()`); await wait(700); await shot(tag + '_2_menu');
      await ev(`app.setMode('lessons'); app.startLesson('l22')`); await wait(2500);
      await ev(`document.body.dataset.menu=''`);
      await ev(`app.goStep(6)`); await wait(5000); await shot(tag + '_3_lesson');
      await ev(`document.querySelector('#run').click()`); await wait(4500); await shot(tag + '_4_run');
      await ev(`document.querySelector('#mtabs [data-tab=code]') && getComputedStyle(document.querySelector('#mtabs')).display !== 'none' && document.querySelector('#mtabs [data-tab=code]').click()`); await wait(800); await shot(tag + '_5_code');
    },
  };
  try { await scripts[scriptName](); } catch (e) { logs.push('[script] ' + e.message); }
  fs.writeFileSync(path.join(outdir, 'console.txt'), logs.join('\n'));
  console.log(logs.filter(l => /error|warn/i.test(l)).slice(0, 30).join('\n') || 'no errors');
  await browser.close();
})();
