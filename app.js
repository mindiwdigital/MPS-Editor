(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ui = {
    welcome: $('welcomeScreen'), editor: $('editorScreen'), projects: $('projectsScreen'),
    file: $('fileInput'), replace: $('replaceInput'), canvas: $('editorCanvas'), selectionPreview: $('selectionPreviewCanvas'), stage: $('canvasStage'),
    placeholder: $('canvasPlaceholder'), panel: $('panelContent'), panelTitle: $('panelTitle'),
    panelShell: $('propertiesPanel'), saveStatus: $('saveStatus'), toast: $('toast'),
    cropOverlay: $('cropOverlay'), cropSelection: $('cropSelection'), selection: $('canvasSelection'),
    exportModal: $('exportModal'), projectGrid: $('projectGrid')
  };
  const ctx = ui.canvas.getContext('2d', { alpha: true, willReadFrequently: false });
  const DB_NAME = 'mindiw-photo-studio';
  const DB_VERSION = 1;
  const STORE = 'projects';
  const PREVIEW_MAX = 1500;
  const MAX_EXPORT_SIDE = 12000;
  const HISTORY_LIMIT = 40;
  const DEFAULT_ADJUSTMENTS = Object.freeze({ brightness: 0, contrast: 0, saturation: 0, exposure: 0, warmth: 0, hue: 0, blur: 0, straighten: 0, perspectiveX: 0, perspectiveY: 0, lensDistortion: 0, inputBlack: 0, inputWhite: 255, gamma: 100, outputBlack: 0, outputWhite: 255, shadowCyanRed: 0, shadowMagentaGreen: 0, shadowYellowBlue: 0, midtoneCyanRed: 0, midtoneMagentaGreen: 0, midtoneYellowBlue: 0, highlightCyanRed: 0, highlightMagentaGreen: 0, highlightYellowBlue: 0, mixRedR: 100, mixRedG: 0, mixRedB: 0, mixGreenR: 0, mixGreenG: 100, mixGreenB: 0, mixBlueR: 0, mixBlueG: 0, mixBlueB: 100, highlights: 0, shadows: 0, whites: 0, blacks: 0, vibrance: 0, clarity: 0, vignette: 0, grain: 0, sepia: 0, tint: 0, toneCurveShadows: 0, toneCurveMidtones: 0, toneCurveHighlights: 0, pixelate: 0, posterize: 0, glow: 0, chromaticShift: 0, splitShadows: 0, splitHighlights: 0, splitBalance: 0, sharpen: 0, noiseReduction: 0, texture: 0, dehaze: 0, selRedC: 0, selRedM: 0, selRedY: 0, selRedK: 0, selYellowC: 0, selYellowM: 0, selYellowY: 0, selYellowK: 0, selGreenC: 0, selGreenM: 0, selGreenY: 0, selGreenK: 0, selCyanC: 0, selCyanM: 0, selCyanY: 0, selCyanK: 0, selBlueC: 0, selBlueM: 0, selBlueY: 0, selBlueK: 0, selMagentaC: 0, selMagentaM: 0, selMagentaY: 0, selMagentaK: 0, selWhiteC: 0, selWhiteM: 0, selWhiteY: 0, selWhiteK: 0, selNeutralC: 0, selNeutralM: 0, selNeutralY: 0, selNeutralK: 0, selBlackC: 0, selBlackM: 0, selBlackY: 0, selBlackK: 0, hslRedHue: 0, hslRedSat: 0, hslRedLum: 0, hslOrangeHue: 0, hslOrangeSat: 0, hslOrangeLum: 0, hslYellowHue: 0, hslYellowSat: 0, hslYellowLum: 0, hslGreenHue: 0, hslGreenSat: 0, hslGreenLum: 0, hslAquaHue: 0, hslAquaSat: 0, hslAquaLum: 0, hslBlueHue: 0, hslBlueSat: 0, hslBlueLum: 0, hslPurpleHue: 0, hslPurpleSat: 0, hslPurpleLum: 0, hslMagentaHue: 0, hslMagentaSat: 0, hslMagentaLum: 0 });
  const PRESETS = {
    original: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, warmth: 0, hue: 0, blur: 0 },
    warm: { brightness: 4, contrast: 5, saturation: 8, exposure: 2, warmth: 24, hue: -3, blur: 0 },
    cool: { brightness: 2, contrast: 7, saturation: -2, exposure: 1, warmth: -25, hue: 8, blur: 0 },
    cinema: { brightness: -4, contrast: 25, saturation: 14, exposure: -2, warmth: 8, hue: -4, blur: 0 },
    mono: { brightness: 2, contrast: 18, saturation: -100, exposure: 0, warmth: 0, hue: 0, blur: 0 },
    vintage: { brightness: 7, contrast: -7, saturation: -22, exposure: 3, warmth: 32, hue: -7, blur: .2 },
    vivid: { brightness: 3, contrast: 13, saturation: 36, exposure: 1, warmth: 0, hue: 0, blur: 0 },
    fade: { brightness: 12, contrast: -18, saturation: -20, exposure: 6, warmth: 6, hue: 0, blur: 0 },
    portrait: { brightness: 7, contrast: 5, saturation: 8, exposure: 3, warmth: 7, hue: -2, blur: 0 },
    dramatic: { brightness: -6, contrast: 32, saturation: 18, exposure: -4, warmth: -4, hue: 0, blur: 0 },
    pastel: { brightness: 14, contrast: -22, saturation: -18, exposure: 8, warmth: 15, hue: 3, blur: .2 },
    teal: { brightness: -2, contrast: 19, saturation: 12, exposure: -1, warmth: -18, hue: 10, blur: 0 },
    noir: { brightness: -9, contrast: 38, saturation: -100, exposure: -5, warmth: 0, hue: 0, blur: 0 },
    bleach: { brightness: 9, contrast: 26, saturation: -42, exposure: 3, warmth: 4, hue: 0, blur: 0 },
    soft: { brightness: 8, contrast: -10, saturation: 12, exposure: 4, warmth: 4, hue: 0, blur: .4 }
  };
  const PANEL_NAMES = { adjust: 'Adjust image', filters: 'Filter library', crop: 'Crop & transform', text: 'Typography', shapes: 'Shapes & elements', draw: 'Brush & drawing', retouch: 'Retouch & remove', select: 'Selections & masks', color: 'Color grading', effects: 'Effects & detail', frames: 'Frames & borders', background: 'Background studio', layers: 'Layers', help: 'Studio guide' };

  let dbPromise;
  let currentBlob = null;
  let sourceBitmap = null;
  let sourceName = '';
  let projectId = null;
  let createdAt = null;
  let state = makeDefaultState();
  let activePanel = 'adjust';
  let selectedOverlayId = null;
  let selectedMaskId = null;
  let isDirty = false;
  let changeVersion = 0;
  let autosaveTimer = null;
  let saveInProgress = false;
  let deferredInstallPrompt = null;
  let zoom = 1;
  let fitScale = 1;
  let displayWidth = 0;
  let displayHeight = 0;
  let compareMode = false;
  let isGridOn = true;
  let orientedCache = null;
  let orientedCacheKey = '';
  let history = [];
  let future = [];
  let pointerOperation = null;
  let lastToast = null;
  let toastTimer = null;
  let panelDelegatesBound = false;
  let panelFieldSnapshot = null;
  const layerImageCache = new Map();

  function makeDefaultCurves() { return { master: [[0,0],[255,255]], red: [[0,0],[255,255]], green: [[0,0],[255,255]], blue: [[0,0],[255,255]] }; }
  function makeDefaultState() {
    return {
      rotation: 0, flipX: false, flipY: false,
      crop: { x: 0, y: 0, w: 1, h: 1 },
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      preset: 'original', overlays: [], strokes: [], curves: makeDefaultCurves(),
      background: 'transparent',
      lut: null,
      backgroundKey: { enabled: false, color: '#ffffff', tolerance: 38, softness: 0 },
      frame: { style: 'none', color: '#ffffff', width: .025, matte: '#ffffff' }
    };
  }

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const niceName = (value) => String(value || 'Untitled project').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 64) || 'Untitled project';
  const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const formatBytes = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  function toast(message) {
    if (lastToast === message && toastTimer) clearTimeout(toastTimer);
    lastToast = message;
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2500);
  }

  function setSaveStatus(label, dirty = false) {
    ui.saveStatus.innerHTML = `<i></i> ${label}`;
    ui.saveStatus.style.color = dirty ? '#d6b77d' : '';
    ui.saveStatus.querySelector('i').style.background = dirty ? '#e9bd6a' : '';
  }

  function openDB() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is not available in this browser.'));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) {
            const store = db.createObjectStore(STORE, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt');
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open local project storage.'));
      });
    }
    return dbPromise;
  }

  async function dbPut(project) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(project);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Could not save project.'));
      tx.onabort = () => reject(tx.error || new Error('Project save was cancelled.'));
    });
  }

  async function dbGetAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve((request.result || []).sort((a, b) => b.updatedAt - a.updatedAt));
      request.onerror = () => reject(request.error || new Error('Could not read saved projects.'));
    });
  }

  async function dbGet(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Could not open project.'));
    });
  }

  async function dbDelete(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Could not delete project.'));
    });
  }

  function currentDimensions() {
    if (!sourceBitmap) return { width: 0, height: 0, orientedWidth: 0, orientedHeight: 0 };
    const turn = ((state.rotation % 360) + 360) % 360;
    const swap = turn === 90 || turn === 270;
    const orientedWidth = swap ? sourceBitmap.height : sourceBitmap.width;
    const orientedHeight = swap ? sourceBitmap.width : sourceBitmap.height;
    return {
      orientedWidth, orientedHeight,
      width: Math.max(1, Math.round(orientedWidth * state.crop.w)),
      height: Math.max(1, Math.round(orientedHeight * state.crop.h))
    };
  }

  function getOrientedCanvas() {
    const key = `${sourceBitmap.width}x${sourceBitmap.height}:${state.rotation}:${state.flipX}:${state.flipY}`;
    if (orientedCache && orientedCacheKey === key) return orientedCache;
    const turn = ((state.rotation % 360) + 360) % 360;
    if (turn === 0 && !state.flipX && !state.flipY) { orientedCache = sourceBitmap; orientedCacheKey = key; return sourceBitmap; }
    const swap = turn === 90 || turn === 270;
    const width = swap ? sourceBitmap.height : sourceBitmap.width;
    const height = swap ? sourceBitmap.width : sourceBitmap.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext('2d');
    c.translate(width / 2, height / 2);
    c.rotate(turn * Math.PI / 180);
    c.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
    c.drawImage(sourceBitmap, -sourceBitmap.width / 2, -sourceBitmap.height / 2);
    orientedCache = canvas;
    orientedCacheKey = key;
    return canvas;
  }

  function cssFilter() {
    const a = state.adjustments;
    const brightness = clamp(100 + a.brightness + a.exposure * .72, 5, 300);
    const contrast = clamp(100 + a.contrast + (a.clarity || 0) * .28, 0, 300);
    const saturation = clamp(100 + a.saturation + (a.vibrance || 0) * .55, 0, 300);
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${a.hue}deg) blur(${a.blur}px)`;
  }

  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0,s=0,l=(max+min)/2;if(d){s=d/(1-Math.abs(2*l-1));switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}}return [h*360,s*100,l*100];}
  function hslToRgb(h,s,l){h=((h%360)+360)%360/360;s=clamp(s/100,0,1);l=clamp(l/100,0,1);const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h*6)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<1/6){r=c;g=x;}else if(h<2/6){r=x;g=c;}else if(h<3/6){g=c;b=x;}else if(h<4/6){g=x;b=c;}else if(h<5/6){r=x;b=c;}else{r=c;b=x;}return [(r+m)*255,(g+m)*255,(b+m)*255];}
  const HSL_CHANNELS=[['Red',0],['Orange',30],['Yellow',60],['Green',120],['Aqua',180],['Blue',240],['Purple',280],['Magenta',320]];
  function channelWeight(hue,center){let d=Math.abs(((hue-center+540)%360)-180);return Math.pow(Math.max(0,1-d/48),1.6);}
  function parseHexColor(hex){const h=String(hex||'#ffffff').replace('#','');return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0];}

  function cubeIndex(size, r, g, b) { return ((b * size + g) * size + r) * 3; }
  function sampleLut3D(lut, r, g, b) {
    const size = lut.size, data = lut.data, min = lut.domainMin || [0,0,0], max = lut.domainMax || [1,1,1];
    const values = [r,g,b].map((v,i)=>clamp((v-min[i])/(max[i]-min[i] || 1),0,1)*(size-1));
    const x0=Math.floor(values[0]),y0=Math.floor(values[1]),z0=Math.floor(values[2]);
    const x1=Math.min(size-1,x0+1),y1=Math.min(size-1,y0+1),z1=Math.min(size-1,z0+1);
    const tx=values[0]-x0,ty=values[1]-y0,tz=values[2]-z0;
    const out=[0,0,0];
    for(let channel=0;channel<3;channel++){
      const at=(x,y,z)=>data[cubeIndex(size,x,y,z)+channel];
      const c00=at(x0,y0,z0)*(1-tx)+at(x1,y0,z0)*tx;
      const c10=at(x0,y1,z0)*(1-tx)+at(x1,y1,z0)*tx;
      const c01=at(x0,y0,z1)*(1-tx)+at(x1,y0,z1)*tx;
      const c11=at(x0,y1,z1)*(1-tx)+at(x1,y1,z1)*tx;
      const c0=c00*(1-ty)+c10*ty, c1=c01*(1-ty)+c11*ty;
      out[channel]=clamp(c0*(1-tz)+c1*tz,0,1);
    }
    return out;
  }
  function parseCubeLut(text) {
    let title='Imported colour look', size=0, domainMin=[0,0,0], domainMax=[1,1,1];
    const rows=[];
    for(const raw of String(text||'').split(/\r?\n/)){
      const line=raw.replace(/#.*$/,'').trim(); if(!line)continue;
      const titleMatch=line.match(/^TITLE\s+"?(.*?)"?$/i); if(titleMatch){title=titleMatch[1].trim()||title;continue;}
      const sizeMatch=line.match(/^LUT_3D_SIZE\s+(\d+)/i); if(sizeMatch){size=Number(sizeMatch[1]);continue;}
      const minMatch=line.match(/^DOMAIN_MIN\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)/i); if(minMatch){domainMin=minMatch.slice(1).map(Number);continue;}
      const maxMatch=line.match(/^DOMAIN_MAX\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)/i); if(maxMatch){domainMax=maxMatch.slice(1).map(Number);continue;}
      if(/^(LUT_1D_SIZE|FLAGS|3DLUT_SIZE)\b/i.test(line))throw new Error('Only 3D .cube LUT files are supported.');
      const parts=line.split(/\s+/).map(Number);
      if(parts.length===3&&parts.every(Number.isFinite))rows.push(...parts);
    }
    if(!Number.isInteger(size)||size<2||size>65)throw new Error('The .cube file has an unsupported 3D LUT size.');
    if(rows.length!==size*size*size*3)throw new Error(`Expected ${size*size*size} RGB entries, found ${rows.length/3}.`);
    const source={size,data:rows,domainMin,domainMax};
    // Keep project/history memory manageable while retaining a useful 17³ lookup grid.
    const targetSize=Math.min(17,size);
    let data=rows;
    if(targetSize!==size){
      data=new Array(targetSize*targetSize*targetSize*3);let p=0;
      for(let b=0;b<targetSize;b++)for(let g=0;g<targetSize;g++)for(let r=0;r<targetSize;r++){
        const sampled=sampleLut3D(source,domainMin[0]+r/(targetSize-1)*(domainMax[0]-domainMin[0]),domainMin[1]+g/(targetSize-1)*(domainMax[1]-domainMin[1]),domainMin[2]+b/(targetSize-1)*(domainMax[2]-domainMin[2]));data[p++]=sampled[0];data[p++]=sampled[1];data[p++]=sampled[2];
      }
    }
    return {title,size:targetSize,data,domainMin,domainMax,sourceSize:size};
  }

  function buildCurveTable(points) {
    const sorted = (Array.isArray(points) && points.length >= 2 ? points : [[0,0],[255,255]])
      .map(point => [clamp(Number(point[0])||0,0,255), clamp(Number(point[1])||0,0,255)])
      .sort((a,b)=>a[0]-b[0]);
    if (sorted[0][0] !== 0) sorted.unshift([0, sorted[0][1]]);
    if (sorted[sorted.length-1][0] !== 255) sorted.push([255, sorted[sorted.length-1][1]]);
    const table = new Uint8ClampedArray(256);
    let segment = 0;
    for (let x=0; x<256; x++) {
      while (segment < sorted.length-2 && x > sorted[segment+1][0]) segment++;
      const [x0,y0]=sorted[segment], [x1,y1]=sorted[segment+1];
      const t = x1 === x0 ? 0 : clamp((x-x0)/(x1-x0),0,1);
      table[x] = Math.round(clamp(y0+(y1-y0)*t,0,255));
    }
    return table;
  }
  function getCurveTables() {
    const curves = state.curves || makeDefaultCurves();
    return {
      master: buildCurveTable(curves.master),
      red: buildCurveTable(curves.red),
      green: buildCurveTable(curves.green),
      blue: buildCurveTable(curves.blue)
    };
  }
  let activeCurveChannel = 'master';
  let curveDrag = null;
  function drawCurveEditor() {
    const canvas=$('curveEditorCanvas'); if(!canvas)return;
    const c=canvas.getContext('2d'), w=canvas.width, h=canvas.height, pad=13, size=w-pad*2;
    c.clearRect(0,0,w,h); c.fillStyle='#171b1d'; c.fillRect(0,0,w,h);
    c.save(); c.translate(pad,pad);
    c.fillStyle='#202729'; c.fillRect(0,0,size,size);
    c.strokeStyle='#ffffff16'; c.lineWidth=1;
    for(let i=0;i<=4;i++){const v=size*i/4;c.beginPath();c.moveTo(v,0);c.lineTo(v,size);c.stroke();c.beginPath();c.moveTo(0,v);c.lineTo(size,v);c.stroke();}
    c.strokeStyle='#a9b3b0'; c.setLineDash([4,4]); c.beginPath(); c.moveTo(0,size); c.lineTo(size,0); c.stroke(); c.setLineDash([]);
    const curves=state.curves||makeDefaultCurves(), points=curves[activeCurveChannel]||[[0,0],[255,255]];
    const table=buildCurveTable(points); const color=activeCurveChannel==='master'?'#f3f5ec':activeCurveChannel==='red'?'#ff7770':activeCurveChannel==='green'?'#75d69b':'#75a9ff';
    c.strokeStyle=color; c.lineWidth=2.5; c.beginPath();
    for(let x=0;x<256;x++){const px=x/255*size, py=size-table[x]/255*size;if(x===0)c.moveTo(px,py);else c.lineTo(px,py);} c.stroke();
    points.forEach((point,index)=>{const x=point[0]/255*size,y=size-point[1]/255*size;c.beginPath();c.arc(x,y,index===0||index===points.length-1?4.2:5,0,Math.PI*2);c.fillStyle='#f1f2ed';c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();});
    c.restore();
  }
  function curvePointFromEvent(event, canvas) {
    const rect=canvas.getBoundingClientRect();
    return {x:clamp((event.clientX-rect.left)/rect.width*255,0,255), y:clamp((1-(event.clientY-rect.top)/rect.height)*255,0,255)};
  }
  function onCurvePointerDown(event) {
    const canvas=event.target.closest('#curveEditorCanvas'); if(!canvas || !sourceBitmap)return;
    event.preventDefault(); const point=curvePointFromEvent(event,canvas);
    state.curves ||= makeDefaultCurves(); const points=state.curves[activeCurveChannel] ||= [[0,0],[255,255]];
    let index=-1, best=18;
    points.forEach((p,i)=>{const dx=(p[0]-point.x)*canvas.clientWidth/255,dy=(p[1]-point.y)*canvas.clientHeight/255,dist=Math.hypot(dx,dy);if(dist<best){best=dist;index=i;}});
    const before=snapshotState();
    if(index<0){if(points.length>=10){toast('A curve can have up to 10 control points.');return;}points.push([Math.round(point.x),Math.round(point.y)]);points.sort((a,b)=>a[0]-b[0]);index=points.findIndex(p=>p[0]===Math.round(point.x)&&p[1]===Math.round(point.y));}
    curveDrag={before,channel:activeCurveChannel,index,canvas,pointerId:event.pointerId};
    canvas.setPointerCapture?.(event.pointerId); updateCurvePoint(event); drawCurveEditor(); renderPreview();
  }
  function updateCurvePoint(event) {
    if(!curveDrag)return; const {channel,index,canvas}=curveDrag,points=state.curves[channel],point=curvePointFromEvent(event,canvas);
    if(index!==0&&index!==points.length-1){const min=(points[index-1]?.[0]||0)+1,max=(points[index+1]?.[0]||255)-1;points[index][0]=Math.round(clamp(point.x,min,max));}
    points[index][1]=Math.round(point.y); drawCurveEditor(); renderPreview();
  }
  function finishCurvePointer() {
    if(!curveDrag)return; const before=curveDrag.before; curveDrag=null; pushHistory(before); updateHistoryButtons(); markDirty();
  }
  function applyAdvancedAdjustments(c, width, height) {
    const a = state.adjustments;
    if (Number(a.pixelate || 0) > 0) {
      const block = 1 + Number(a.pixelate) * .42;
      const small = document.createElement('canvas'); small.width = Math.max(1, Math.round(width / block)); small.height = Math.max(1, Math.round(height / block));
      const sc = small.getContext('2d'); sc.imageSmoothingEnabled = false; sc.drawImage(c.canvas,0,0,small.width,small.height);
      c.save(); c.imageSmoothingEnabled = false; c.clearRect(0,0,width,height); c.drawImage(small,0,0,width,height); c.restore(); small.width=small.height=1;
    }
    const levelsActive = Number(a.inputBlack||0)!==0 || Number(a.inputWhite??255)!==255 || Number(a.gamma??100)!==100 || Number(a.outputBlack||0)!==0 || Number(a.outputWhite??255)!==255;
    const curveActive = Object.values(state.curves||{}).some(points => Array.isArray(points) && (points.length!==2 || points[0][0]!==0 || points[0][1]!==0 || points[1][0]!==255 || points[1][1]!==255));
    const needsPixels = !!state.lut?.data?.length || levelsActive || curveActive || Object.keys(a).some(k => (k.startsWith('hsl') || k.startsWith('toneCurve') || ['highlights','shadows','whites','blacks','tint','sepia','grain','splitShadows','splitHighlights','splitBalance','sharpen','noiseReduction','texture','dehaze','posterize','glow','chromaticShift','selRedC','selRedM','selRedY','selRedK','selYellowC','selYellowM','selYellowY','selYellowK','selGreenC','selGreenM','selGreenY','selGreenK','selCyanC','selCyanM','selCyanY','selCyanK','selBlueC','selBlueM','selBlueY','selBlueK','selMagentaC','selMagentaM','selMagentaY','selMagentaK','selWhiteC','selWhiteM','selWhiteY','selWhiteK','selNeutralC','selNeutralM','selNeutralY','selNeutralK','selBlackC','selBlackM','selBlackY','selBlackK','shadowCyanRed','shadowMagentaGreen','shadowYellowBlue','midtoneCyanRed','midtoneMagentaGreen','midtoneYellowBlue','highlightCyanRed','highlightMagentaGreen','highlightYellowBlue','mixRedR','mixRedG','mixRedB','mixGreenR','mixGreenG','mixGreenB','mixBlueR','mixBlueG','mixBlueB'].includes(k)) && Number(a[k] || 0) !== 0);
    if (!needsPixels) {
      if (a.vignette > 0) drawVignette(c, width, height, a.vignette);
      return;
    }
    try {
      const image = c.getImageData(0, 0, width, height);
      const data = image.data;
      const highlights = Number(a.highlights || 0) / 100;
      const shadows = Number(a.shadows || 0) / 100;
      const whites = Number(a.whites || 0) / 100;
      const blacks = Number(a.blacks || 0) / 100;
      const tint = Number(a.tint || 0) / 100;
      const sepia = Number(a.sepia || 0) / 100;
      const grain = Number(a.grain || 0) / 100;
      const curveSh=Number(a.toneCurveShadows||0)/100, curveMid=Number(a.toneCurveMidtones||0)/100, curveHi=Number(a.toneCurveHighlights||0)/100;
      const splitSh=Number(a.splitShadows||0)/100, splitHi=Number(a.splitHighlights||0)/100, splitBal=Number(a.splitBalance||0)/100;
      const hslValues=HSL_CHANNELS.map(([name,center])=>({center,h:Number(a[`hsl${name}Hue`]||0),s:Number(a[`hsl${name}Sat`]||0),l:Number(a[`hsl${name}Lum`]||0)})); const hslActive=hslValues.some(v=>v.h||v.s||v.l);
      const balanceKeys=['shadowCyanRed','shadowMagentaGreen','shadowYellowBlue','midtoneCyanRed','midtoneMagentaGreen','midtoneYellowBlue','highlightCyanRed','highlightMagentaGreen','highlightYellowBlue'];
      const balanceActive=balanceKeys.some(k=>Number(a[k]||0)!==0);
      const mixerKeys=['mixRedR','mixRedG','mixRedB','mixGreenR','mixGreenG','mixGreenB','mixBlueR','mixBlueG','mixBlueB'];
      const mixerActive=mixerKeys.some(k=>Number(a[k]??(k.endsWith('R')||k.endsWith('G')||k.endsWith('B')?100:0))!==((k==='mixRedR'||k==='mixGreenG'||k==='mixBlueB')?100:0));
      const selectiveRanges=[['Red',0],['Yellow',60],['Green',120],['Cyan',180],['Blue',240],['Magenta',300],['White','white'],['Neutral','neutral'],['Black','black']].map(([name,center])=>({name,center,c:Number(a[`sel${name}C`]||0),m:Number(a[`sel${name}M`]||0),y:Number(a[`sel${name}Y`]||0),k:Number(a[`sel${name}K`]||0)}));
      const selectiveActive=selectiveRanges.some(v=>v.c||v.m||v.y||v.k);
      const sharpen=Number(a.sharpen||0)/100, noiseReduction=Number(a.noiseReduction||0)/100, texture=Number(a.texture||0)/100, dehaze=Number(a.dehaze||0)/100;
      const posterizeLevels = Number(a.posterize||0) > 0 ? Math.max(2, Math.round(64 - Number(a.posterize) * .62)) : 0;
      const lut = state.lut?.data?.length ? state.lut : null;
      const curveTables = curveActive ? getCurveTables() : null;
      const inBlack=clamp(Number(a.inputBlack||0),0,254), inWhite=clamp(Number(a.inputWhite??255),inBlack+1,255), gamma=Math.max(.05,Number(a.gamma??100)/100), outBlack=clamp(Number(a.outputBlack||0),0,254), outWhite=clamp(Number(a.outputWhite??255),outBlack+1,255);
      const mapLevel=value=>outBlack+Math.pow(clamp((value-inBlack)/(inWhite-inBlack),0,1),1/gamma)*(outWhite-outBlack);
      const originalData=(sharpen||noiseReduction||texture)?new Uint8ClampedArray(data):null;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] === 0) continue;
        let r=data[i], g=data[i+1], b=data[i+2];
        const lum=(r*.2126+g*.7152+b*.0722)/255;
        const sh=(1-lum)*(1-lum)*shadows*120;
        const hi=lum*lum*highlights*110;
        const wh=Math.max(0,(lum-.72)/.28)*whites*70;
        const bl=Math.max(0,(.28-lum)/.28)*blacks*70;
        r=clamp(r+sh+hi+wh+bl+tint*22,0,255);
        g=clamp(g+sh+hi+wh+bl-tint*12,0,255);
        b=clamp(b+sh+hi+wh+bl+tint*22,0,255);
        if (sepia) {
          const sr=clamp(r*.393+g*.769+b*.189,0,255), sg=clamp(r*.349+g*.686+b*.168,0,255), sb=clamp(r*.272+g*.534+b*.131,0,255);
          r=r+(sr-r)*sepia; g=g+(sg-g)*sepia; b=b+(sb-b)*sepia;
        }
        if(curveSh||curveMid||curveHi){const luma=(r*.2126+g*.7152+b*.0722)/255;const delta=curveSh*(1-luma)*(1-luma)*75+curveMid*(1-Math.abs(luma-.5)*2)*55+curveHi*luma*luma*75;r+=delta;g+=delta;b+=delta;}
        if(splitSh||splitHi){const luma=(r*.2126+g*.7152+b*.0722)/255;const sw=clamp((.62-luma+splitBal*.25)/.62,0,1)*splitSh*.48;const hw=clamp((luma-.28-splitBal*.25)/.72,0,1)*splitHi*.48;r=r*(1-sw-hw)+20*sw+255*hw;g=g*(1-sw-hw)+125*sw+168*hw;b=b*(1-sw-hw)+190*sw+85*hw;}
        if(balanceActive){const luma=(r*.2126+g*.7152+b*.0722)/255;const zones=[['shadow',(1-luma)*(1-luma)],['midtone',Math.max(0,1-Math.abs(luma-.5)*2)],['highlight',luma*luma]];for(const [zone,weight] of zones){const cr=Number(a[`${zone}CyanRed`]||0)/100*weight*42,mg=Number(a[`${zone}MagentaGreen`]||0)/100*weight*42,yb=Number(a[`${zone}YellowBlue`]||0)/100*weight*42;r+=cr-mg*.28-yb*.28;g+=mg-cr*.28-yb*.28;b+=yb-cr*.28-mg*.28;}}
        if(hslActive){let [hh,ss,ll]=rgbToHsl(r,g,b);let dh=0,ds=0,dl=0,weightSum=0;for(const v of hslValues){const w=channelWeight(hh,v.center);if(w>.001){dh+=v.h*w;ds+=v.s*w;dl+=v.l*w;weightSum+=w;}}hh+=dh;ss=clamp(ss+ds,0,100);ll=clamp(ll+dl,0,100);[r,g,b]=hslToRgb(hh,ss,ll);}
        if(selectiveActive){const [hh,ss,ll]=rgbToHsl(r,g,b);const lum=(r*.2126+g*.7152+b*.0722)/255;for(const v of selectiveRanges){let w=0;if(typeof v.center==='number')w=channelWeight(hh,v.center);else if(v.center==='white')w=clamp((lum-.68)/.28,0,1);else if(v.center==='black')w=clamp((.30-lum)/.28,0,1);else w=clamp((lum-.12)/.18,0,1)*(1-clamp((lum-.70)/.20,0,1));if(w<.001)continue;const c=v.c*w/100,m=v.m*w/100,y=v.y*w/100,k=v.k*w/100;r+=(-c*68+m*10+y*10-k*78);g+=(-m*68+c*10+y*10-k*78);b+=(-y*68+c*10+m*10-k*78);}}
        if(dehaze>0){const l=(r*.2126+g*.7152+b*.0722)/255,amount=dehaze*.42;r=(r-128)*(1+amount)+128;g=(g-128)*(1+amount)+128;b=(b-128)*(1+amount)+128;const sat=1+dehaze*.16;r=l*255+(r-l*255)*sat;g=l*255+(g-l*255)*sat;b=l*255+(b-l*255)*sat;}
        if(levelsActive){r=mapLevel(r);g=mapLevel(g);b=mapLevel(b);}
        if(mixerActive){const nr=(r*Number(a.mixRedR??100)+g*Number(a.mixRedG||0)+b*Number(a.mixRedB||0))/100;const ng=(r*Number(a.mixGreenR||0)+g*Number(a.mixGreenG??100)+b*Number(a.mixGreenB||0))/100;const nb=(r*Number(a.mixBlueR||0)+g*Number(a.mixBlueG||0)+b*Number(a.mixBlueB??100))/100;r=nr;g=ng;b=nb;}
        if(curveTables){r=curveTables.red[curveTables.master[Math.round(clamp(r,0,255))]];g=curveTables.green[curveTables.master[Math.round(clamp(g,0,255))]];b=curveTables.blue[curveTables.master[Math.round(clamp(b,0,255))]];}
        if (grain) { const n=(Math.random()-.5)*grain*52; r+=n; g+=n; b+=n; }
        if(posterizeLevels>0){const step=255/(posterizeLevels-1);r=Math.round(r/step)*step;g=Math.round(g/step)*step;b=Math.round(b/step)*step;}
        if(lut){const mapped=sampleLut3D(lut,r/255,g/255,b/255);r=mapped[0]*255;g=mapped[1]*255;b=mapped[2]*255;}
        if(originalData&&(sharpen||noiseReduction||texture)){const x=(i/4)%width,y=Math.floor(i/4/width);let ar=0,ag=0,ab=0,count=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const px=clamp(x+ox,0,width-1),py=clamp(y+oy,0,height-1),j=(py*width+px)*4;ar+=originalData[j];ag+=originalData[j+1];ab+=originalData[j+2];count++;}ar/=count;ag/=count;ab/=count;const nr=originalData[i],ng=originalData[i+1],nb=originalData[i+2],denoise=noiseReduction*.72,sharp=sharpen*1.8,tex=texture*1.25;r=r*(1-denoise)+ar*denoise+(nr-ar)*(sharp+tex);g=g*(1-denoise)+ag*denoise+(ng-ag)*(sharp+tex);b=b*(1-denoise)+ab*denoise+(nb-ab)*(sharp+tex);}
        data[i]=clamp(r,0,255); data[i+1]=clamp(g,0,255); data[i+2]=clamp(b,0,255);
      }
      c.putImageData(image,0,0);
    } catch (error) { console.warn('Advanced pixel adjustments unavailable:', error); }
    if (Number(a.glow || 0) > 0) {
      const glowCanvas=document.createElement('canvas');glowCanvas.width=width;glowCanvas.height=height;const gc=glowCanvas.getContext('2d');
      gc.filter=`blur(${Math.max(2,Math.min(width,height)*.018)}px)`;gc.drawImage(c.canvas,0,0);gc.filter='none';
      c.save();c.globalCompositeOperation='screen';c.globalAlpha=clamp(Number(a.glow)/100,0,.75);c.drawImage(glowCanvas,0,0);c.restore();glowCanvas.width=glowCanvas.height=1;
    }
    if (Number(a.chromaticShift || 0) > 0) applyChromaticShift(c,width,height,Number(a.chromaticShift));
    if (a.vignette > 0) drawVignette(c, width, height, a.vignette);
  }

  function applyChromaticShift(c,width,height,amount){
    try{const shift=Math.max(1,Math.round(amount/100*Math.min(width,height)*.012));const image=c.getImageData(0,0,width,height);const red=document.createElement('canvas'),cyan=document.createElement('canvas');red.width=cyan.width=width;red.height=cyan.height=height;const rc=red.getContext('2d'),cc=cyan.getContext('2d');const rd=rc.createImageData(width,height),cd=cc.createImageData(width,height);for(let i=0;i<image.data.length;i+=4){rd.data[i]=image.data[i];rd.data[i+3]=image.data[i+3];cd.data[i+1]=image.data[i+1];cd.data[i+2]=image.data[i+2];cd.data[i+3]=image.data[i+3];}rc.putImageData(rd,0,0);cc.putImageData(cd,0,0);c.clearRect(0,0,width,height);c.globalCompositeOperation='lighter';c.drawImage(cyan,-shift,0);c.drawImage(red,shift,0);c.globalCompositeOperation='source-over';red.width=red.height=cyan.width=cyan.height=1;}catch(error){console.debug('Chromatic shift unavailable',error);}
  }

  function drawVignette(c, width, height, amount) {
    const strength = clamp(Number(amount) / 100, 0, 1);
    const gradient = c.createRadialGradient(width/2,height/2,Math.min(width,height)*.12,width/2,height/2,Math.max(width,height)*.72);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(.58, `rgba(0,0,0,${strength*.08})`);
    gradient.addColorStop(1, `rgba(0,0,0,${strength*.78})`);
    c.save(); c.fillStyle=gradient; c.fillRect(0,0,width,height); c.restore();
  }

  function applyColorKey(c, width, height) {
    const key=state.backgroundKey;
    if (!key?.enabled) return;
    try {
      const image=c.getImageData(0,0,width,height), data=image.data;
      const hex=(key.color||'#ffffff').replace('#','');
      const kr=parseInt(hex.slice(0,2),16),kg=parseInt(hex.slice(2,4),16),kb=parseInt(hex.slice(4,6),16);
      const tol=clamp(Number(key.tolerance||0),0,180), soft=clamp(Number(key.softness||0),0,100);
      const max= Math.sqrt(3*255*255);
      const threshold=tol/max*441.7, feather=Math.max(.0001,soft/100*0.22);
      for(let i=0;i<data.length;i+=4){
        const d=Math.sqrt((data[i]-kr)**2+(data[i+1]-kg)**2+(data[i+2]-kb)**2);
        const normalized=d/441.7;
        const edge=tol/441.7;
        if(normalized<=edge) data[i+3]=0;
        else if(soft>0 && normalized<edge+feather) data[i+3]=Math.round(data[i+3]*((normalized-edge)/feather));
      }
      c.putImageData(image,0,0);
    } catch(error){ console.warn('Color key is not available for this image:',error); }
  }

  function drawFrame(c,width,height) {
    const f=state.frame||{}; if(!f.style||f.style==='none')return;
    const w=Math.max(2,Math.min(width,height)*(f.width||.025));
    c.save();
    const color=f.color||'#ffffff';
    if(f.style==='polaroid'){
      c.fillStyle=f.matte||'#ffffff'; c.fillRect(0,height-w*3.1,width,w*3.1);
      c.strokeStyle=f.matte||'#ffffff'; c.lineWidth=w; c.strokeRect(w/2,w/2,width-w,height-w*3.1);
    } else if(f.style==='film'){
      c.strokeStyle='#090b12'; c.lineWidth=w; c.strokeRect(w/2,w/2,width-w,height-w);
      const hole=Math.max(3,w*.38), gap=hole*1.7; c.fillStyle=color;
      for(let x=w*.35;x<width-w*.7;x+=gap){c.fillRect(x,w*.27,hole,hole);c.fillRect(x,height-w*.27-hole,hole,hole);}
    } else if(f.style==='double'){
      c.strokeStyle=color; c.lineWidth=w; c.strokeRect(w/2,w/2,width-w,height-w);
      c.lineWidth=Math.max(1,w*.22); c.strokeRect(w*1.55,w*1.55,width-w*3.1,height-w*3.1);
    } else if(f.style==='soft'){
      c.strokeStyle=color; c.lineWidth=w; c.strokeRect(w/2,w/2,width-w,height-w);
      c.strokeStyle='#ffffff80'; c.lineWidth=Math.max(1,w*.3); c.strokeRect(w*1.45,w*1.45,width-w*2.9,height-w*2.9);
    } else {
      c.strokeStyle=f.style==='black'?'#080a10':color; c.lineWidth=w; c.strokeRect(w/2,w/2,width-w,height-w);
    }
    c.restore();
  }

  function applyCloneStrokes(c,width,height) {
    const retouch=state.strokes.filter(stroke=>(stroke.mode==='clone'||stroke.mode==='heal')&&stroke.points?.length&&stroke.sample);
    if(!retouch.length)return;
    const source=document.createElement('canvas');source.width=width;source.height=height;source.getContext('2d').drawImage(c.canvas,0,0);
    const minSide=Math.min(width,height);
    for(const stroke of retouch){
      const first=stroke.points[0],sample=stroke.sample,diameter=Math.max(2,(stroke.width||.006)*minSide),radius=diameter/2;
      for(const point of stroke.points){
        const dx=point.x*width,dy=point.y*height,sx=sample.x*width+(point.x-first.x)*width,sy=sample.y*height+(point.y-first.y)*height;
        if(sx<radius||sy<radius||sx>width-radius||sy>height-radius||dx<radius||dy<radius||dx>width-radius||dy>height-radius)continue;
        const patch=document.createElement('canvas');patch.width=patch.height=Math.max(2,Math.round(diameter));const pc=patch.getContext('2d',{willReadFrequently:true});
        pc.drawImage(source,sx-radius,sy-radius,diameter,diameter,0,0,patch.width,patch.height);
        if(stroke.mode==='heal'){
          const dest=document.createElement('canvas');dest.width=dest.height=patch.width;const dc=dest.getContext('2d',{willReadFrequently:true});dc.drawImage(source,dx-radius,dy-radius,diameter,diameter,0,0,dest.width,dest.height);
          const sd=pc.getImageData(0,0,patch.width,patch.height),dd=dc.getImageData(0,0,dest.width,dest.height);let sr=0,sg=0,sb=0,dr=0,dg=0,db=0,n=0;
          for(let i=0;i<sd.data.length;i+=16){sr+=sd.data[i];sg+=sd.data[i+1];sb+=sd.data[i+2];dr+=dd.data[i];dg+=dd.data[i+1];db+=dd.data[i+2];n++;}
          const delta=[(dr-sr)/n,(dg-sg)/n,(db-sb)/n];for(let i=0;i<sd.data.length;i+=4){sd.data[i]=clamp(sd.data[i]+delta[0],0,255);sd.data[i+1]=clamp(sd.data[i+1]+delta[1],0,255);sd.data[i+2]=clamp(sd.data[i+2]+delta[2],0,255);}pc.putImageData(sd,0,0);dest.width=dest.height=1;
        }
        c.save();c.globalAlpha=clamp(stroke.opacity??1,0,1);c.beginPath();c.arc(dx,dy,radius,0,Math.PI*2);c.clip();if(stroke.mode==='heal'){c.filter=`blur(${Math.max(.3,radius*.075)}px)`;}c.drawImage(patch,dx-radius,dy-radius,diameter,diameter);c.restore();patch.width=patch.height=1;
      }
    }
    source.width=source.height=1;
  }

  function applyRedEyeMarks(c,width,height){
    const marks=state.strokes.filter(stroke=>stroke.mode==='red-eye'&&stroke.points?.length);
    if(!marks.length)return;
    try{const image=c.getImageData(0,0,width,height),data=image.data,minSide=Math.min(width,height);
      for(const mark of marks){for(const p of mark.points){const cx=p.x*width,cy=p.y*height,r=Math.max(2,(mark.width||.018)*minSide*.7),x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(width-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(height-1,Math.ceil(cy+r));
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy>r*r)continue;const i=(y*width+x)*4,red=data[i],green=data[i+1],blue=data[i+2];if(red>green*1.18&&red>blue*1.12&&red-green>12){const strength=clamp(1-Math.sqrt(dx*dx+dy*dy)/r,0,1);data[i]=Math.round(red*(1-strength*.9));data[i+1]=clamp(green+strength*10,0,255);data[i+2]=clamp(blue+strength*8,0,255);}}
      }}c.putImageData(image,0,0);
    }catch(error){console.debug('Red-eye reduction unavailable',error);}
  }

  function drawTrackedText(ctx, text, x, y, tracking, align, stroke=false) {
    const method=stroke?'strokeText':'fillText';
    if(!tracking){ctx[method](text,x,y);return;}
    if('letterSpacing' in ctx){const old=ctx.letterSpacing;ctx.letterSpacing=`${tracking}px`;ctx[method](text,x,y);ctx.letterSpacing=old;return;}
    const chars=Array.from(text), widths=chars.map(ch=>ctx.measureText(ch).width), total=widths.reduce((a,b)=>a+b,0)+Math.max(0,chars.length-1)*tracking;
    let cursor=align==='left'?x:align==='right'?x-total:x-total/2;
    chars.forEach((ch,i)=>{ctx[method](ch,cursor,y);cursor+=widths[i]+tracking;});
  }

  function drawOverlays(c, width, height) {
    const minSide = Math.min(width, height);
    for (const item of state.overlays) {
      if (item.visible === false) continue;
      c.save();
      c.globalAlpha = clamp(Number(item.opacity ?? 1), 0, 1);
      c.globalCompositeOperation = ({normal:'source-over',multiply:'multiply',screen:'screen',overlay:'overlay',darken:'darken',lighten:'lighten','soft-light':'soft-light','hard-light':'hard-light','color-dodge':'color-dodge','color-burn':'color-burn',difference:'difference',exclusion:'exclusion',hue:'hue',saturation:'saturation',color:'color',luminosity:'luminosity',lighter:'lighter'})[item.blendMode||'normal'] || 'source-over';
      const x = (item.x ?? .5) * width;
      const y = (item.y ?? .5) * height;
      c.translate(x, y);
      c.rotate((item.rotation || 0) * Math.PI / 180);
      if (item.type === 'text' || item.type === 'sticker') {
        const fontSize = Math.max(8, (item.size || .09) * minSide);
        c.textAlign = item.align || 'center';
        c.textBaseline = 'middle';
        c.shadowColor = Number(item.shadowBlur||0)>0 ? (item.shadowColor||'#000000') : 'transparent';
        c.shadowBlur = clamp(Number(item.shadowBlur||0),0,80);
        c.shadowOffsetX = Number(item.shadowOffsetX||0); c.shadowOffsetY = Number(item.shadowOffsetY||0);
        c.font = `${item.bold === false ? '500' : '800'} ${fontSize}px ${item.font || 'Arial, sans-serif'}`;
        c.lineJoin = 'round';
        const lines = String(item.text || '').split('\n').slice(0, 12);
        const lineHeight = fontSize * clamp(Number(item.lineHeight||1.2),.8,2.4);
        const totalH = lines.length * lineHeight;
        lines.forEach((line, index) => {
          const yy = -totalH / 2 + lineHeight * (index + .5);
          if (item.stroke && item.stroke !== 'none') {
            c.lineWidth = Math.max(1, fontSize * .075);
            c.strokeStyle = item.stroke;
            c.lineWidth = Math.max(1, fontSize * Number(item.strokeWidth || .075));
            drawTrackedText(c,line, item.align==='left' ? -Math.max(...lines.map(t=>c.measureText(t).width))/2 : item.align==='right' ? Math.max(...lines.map(t=>c.measureText(t).width))/2 : 0, yy, Number(item.letterSpacing||0), item.align||'center', true);
          }
          c.fillStyle = item.color || '#ffffff';
          drawTrackedText(c,line, item.align==='left' ? -Math.max(...lines.map(t=>c.measureText(t).width))/2 : item.align==='right' ? Math.max(...lines.map(t=>c.measureText(t).width))/2 : 0, yy, Number(item.letterSpacing||0), item.align||'center', false);
        });
      } else if (item.type === 'gradient') {
        const w=Math.max(1,(item.w||.8)*width),h=Math.max(1,(item.h||.8)*height),angle=Number(item.angle||0)*Math.PI/180;
        const dx=Math.cos(angle)*w/2,dy=Math.sin(angle)*h/2;
        const gradient=c.createLinearGradient(-dx,-dy,dx,dy);gradient.addColorStop(0,item.color||'#f2a65a');gradient.addColorStop(1,item.color2||'#5178c8');
        c.fillStyle=gradient;c.fillRect(-w/2,-h/2,w,h);
      } else if (item.type === 'image') {
        const img=layerImageCache.get(item.id);
        const w=Math.max(1,(item.w||.3)*width), h=Math.max(1,(item.h||.3)*height);
        if(img && img.complete && img.naturalWidth){
          c.shadowColor=item.shadow?'#0009':'transparent'; c.shadowBlur=item.shadow?minSide*.025:0; c.shadowOffsetY=item.shadow?minSide*.008:0;
          if(item.radius){c.beginPath();c.roundRect(-w/2,-h/2,w,h,Math.min(w,h)*item.radius);c.clip();}
          c.drawImage(img,-w/2,-h/2,w,h);
          if(item.border){c.shadowColor='transparent';c.lineWidth=Math.max(1,minSide*.004);c.strokeStyle=item.border;c.strokeRect(-w/2,-h/2,w,h);}
        }
      } else {
        const w = Math.max(1, (item.w || .25) * width);
        const h = Math.max(1, (item.h || .18) * height);
        c.lineWidth = Math.max(1, (item.strokeWidth || .004) * minSide);
        c.strokeStyle = item.stroke || item.color || '#ffffff';
        c.fillStyle = item.color || '#9be36c';
        if (item.type === 'circle') {
          c.beginPath(); c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          if (item.fill !== false) c.fill();
          if (item.outline !== false) c.stroke();
        } else if (item.type === 'line') {
          c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.stroke();
        } else if (item.type === 'arrow') {
          c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.moveTo(w / 2 - h * .45, -h * .35); c.lineTo(w / 2, 0); c.lineTo(w / 2 - h * .45, h * .35); c.stroke();
        } else {
          if (item.fill !== false) c.fillRect(-w / 2, -h / 2, w, h);
          if (item.outline !== false) c.strokeRect(-w / 2, -h / 2, w, h);
        }
      }
      c.restore();
    }
    for (const stroke of state.strokes) {
      if (['clone','heal','red-eye'].includes(stroke.mode) || !stroke.points || stroke.points.length < 1) continue;
      c.save();
      c.globalAlpha = clamp(stroke.opacity ?? 1, 0, 1);
      c.globalCompositeOperation = stroke.mode === 'erase' ? 'destination-out' : stroke.mode === 'dodge' ? 'screen' : stroke.mode === 'burn' ? 'multiply' : 'source-over';
      c.lineCap = 'round'; c.lineJoin = 'round';
      if(stroke.mode==='dodge'||stroke.mode==='burn'){c.shadowBlur=c.lineWidth*.28;c.shadowColor=stroke.mode==='dodge'?'#ffffff':'#000000';}
      c.strokeStyle = stroke.mode==='dodge'?'#ffffff':stroke.mode==='burn'?'#111111':stroke.color || '#ffffff';
      c.lineWidth = Math.max(1, (stroke.width || .006) * minSide);
      c.beginPath();
      const first = stroke.points[0];
      c.moveTo(first.x * width, first.y * height);
      for (let i = 1; i < stroke.points.length; i++) c.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
      if (stroke.points.length === 1) c.lineTo(first.x * width + .2, first.y * height + .2);
      c.stroke(); c.restore();
    }
  }

  function selectionPath(ctx2, selection, width, height) {
    if (!selection) return false;
    ctx2.beginPath();
    if (selection.shape === 'linear') {
      const a=selection.start||{x:selection.x||0,y:selection.y||0}, b=selection.end||a;
      ctx2.moveTo(a.x*width,a.y*height); ctx2.lineTo(b.x*width,b.y*height);
    } else if (selection.shape === 'radial') {
      const a=selection.start||{x:selection.x||.5,y:selection.y||.5}, b=selection.end||a;
      const radius=Math.max(1,Math.hypot((b.x-a.x)*width,(b.y-a.y)*height));
      ctx2.arc(a.x*width,a.y*height,radius,0,Math.PI*2);
    } else if (selection.shape === 'ellipse') {
      const x = (selection.x || 0) * width, y = (selection.y || 0) * height;
      const w = (selection.w || 0) * width, h = (selection.h || 0) * height;
      ctx2.ellipse(x + w / 2, y + h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2);
    } else if (selection.shape === 'lasso' && selection.points?.length > 2) {
      ctx2.moveTo(selection.points[0].x * width, selection.points[0].y * height);
      for (let i = 1; i < selection.points.length; i++) ctx2.lineTo(selection.points[i].x * width, selection.points[i].y * height);
      ctx2.closePath();
    } else if (selection.shape === 'paint' && selection.strokes?.length) {
      ctx2.lineCap = 'round'; ctx2.lineJoin = 'round';
      for (const stroke of selection.strokes) {
        if (!stroke.points?.length) continue;
        ctx2.lineWidth = Math.max(1, (stroke.width || .03) * Math.min(width, height));
        ctx2.beginPath(); ctx2.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (let i = 1; i < stroke.points.length; i++) ctx2.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
        if (stroke.points.length === 1) ctx2.lineTo(stroke.points[0].x * width + .5, stroke.points[0].y * height + .5);
        ctx2.stroke();
      }
    } else {
      const box = selection.shape === 'magic' && selection.bounds ? selection.bounds : selection;
      const x = (box.x || 0) * width, y = (box.y || 0) * height;
      ctx2.rect(x, y, (box.w || 0) * width, (box.h || 0) * height);
    }
    return true;
  }

  function buildMagicWandMask(selection, width, height) {
    const oriented = getOrientedCanvas();
    const crop = state.crop;
    const sx = clamp(crop.x, 0, .999) * oriented.width;
    const sy = clamp(crop.y, 0, .999) * oriented.height;
    const sw = clamp(crop.w, .001, 1) * oriented.width;
    const sh = clamp(crop.h, .001, 1) * oriented.height;
    const factor = Math.min(1, 1600 / Math.max(width, height));
    const mw = Math.max(1, Math.round(width * factor)), mh = Math.max(1, Math.round(height * factor));
    const sample = document.createElement('canvas'); sample.width = mw; sample.height = mh;
    const sc = sample.getContext('2d', { willReadFrequently: true });
    sc.drawImage(oriented, sx, sy, sw, sh, 0, 0, mw, mh);
    const source = sc.getImageData(0, 0, mw, mh).data;
    const total = mw * mh;
    const seedX = clamp(Math.round((selection.x || 0) * (mw - 1)), 0, mw - 1);
    const seedY = clamp(Math.round((selection.y || 0) * (mh - 1)), 0, mh - 1);
    const seedIndex = (seedY * mw + seedX) * 4;
    const sr = source[seedIndex], sg = source[seedIndex + 1], sb = source[seedIndex + 2];
    const tolerance = clamp(Number(selection.tolerance ?? 34), 0, 255);
    const maxDistance = tolerance * tolerance * 3;
    const maskData = new ImageData(mw, mh);
    const alpha = maskData.data;
    const matches = (i) => {
      const dr = source[i] - sr, dg = source[i + 1] - sg, db = source[i + 2] - sb;
      return source[i + 3] > 8 && dr*dr + dg*dg + db*db <= maxDistance;
    };
    if (selection.contiguous === false) {
      for (let p = 0; p < total; p++) {
        const i = p * 4;
        if (matches(i)) { alpha[i] = alpha[i+1] = alpha[i+2] = 255; alpha[i+3] = 255; }
      }
    } else {
      const seen = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0, tail = 0;
      const seed = seedY * mw + seedX;
      seen[seed] = 1; queue[tail++] = seed;
      while (head < tail) {
        const p = queue[head++], i = p * 4;
        if (!matches(i)) continue;
        alpha[i] = alpha[i+1] = alpha[i+2] = alpha[i+3] = 255;
        const x = p % mw, y = (p / mw) | 0;
        const neighbors = [x > 0 ? p-1 : -1, x < mw-1 ? p+1 : -1, y > 0 ? p-mw : -1, y < mh-1 ? p+mw : -1];
        for (const n of neighbors) if (n >= 0 && !seen[n]) { seen[n] = 1; if (matches(n*4)) queue[tail++] = n; }
      }
    }
    const mask = document.createElement('canvas'); mask.width = mw; mask.height = mh;
    mask.getContext('2d').putImageData(maskData, 0, 0);
    sample.width = sample.height = 1;
    // Record a useful bounds rectangle for the marching-ants preview.
    let minX=mw, minY=mh, maxX=-1, maxY=-1;
    for (let p=0;p<total;p++) if (alpha[p*4+3] > 0) { const x=p%mw, y=(p/mw)|0; if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y; }
    if (maxX >= minX) { selection.bounds = { x:minX/mw, y:minY/mh, w:(maxX-minX+1)/mw, h:(maxY-minY+1)/mh }; }
    return mask;
  }

  function buildSelectionMask(selection, width, height, feather = 0) {
    if (selection.shape === 'magic') {
      const magic = buildMagicWandMask(selection, width, height);
      if (feather > 0) {
        const blurred = document.createElement('canvas'); blurred.width = magic.width; blurred.height = magic.height;
        const bc = blurred.getContext('2d'); bc.filter = `blur(${clamp(feather,0,30)/100*Math.min(width,height)*.12}px)`; bc.drawImage(magic,0,0); magic.width=magic.height=1;
        if (selection.invert) { const bctx=blurred.getContext('2d',{willReadFrequently:true}), image=bctx.getImageData(0,0,blurred.width,blurred.height); for(let i=3;i<image.data.length;i+=4)image.data[i]=255-image.data[i]; bctx.putImageData(image,0,0); }
        return blurred;
      }
      if (selection.invert) { const mctx=magic.getContext('2d',{willReadFrequently:true}), image=mctx.getImageData(0,0,magic.width,magic.height); for(let i=3;i<image.data.length;i+=4)image.data[i]=255-image.data[i]; mctx.putImageData(image,0,0); }
      return magic;
    }
    const mask = document.createElement('canvas'); mask.width = width; mask.height = height;
    const m = mask.getContext('2d'); m.clearRect(0,0,width,height);
    if (selection.shape === 'linear' || selection.shape === 'radial') {
      const a=selection.start||{x:.5,y:.5}, b=selection.end||a;
      let gradient;
      if (selection.shape === 'linear') gradient=m.createLinearGradient(a.x*width,a.y*height,b.x*width,b.y*height);
      else gradient=m.createRadialGradient(a.x*width,a.y*height,0,a.x*width,a.y*height,Math.max(1,Math.hypot((b.x-a.x)*width,(b.y-a.y)*height)));
      gradient.addColorStop(0,'rgba(255,255,255,1)'); gradient.addColorStop(1,'rgba(255,255,255,0)'); m.fillStyle=gradient; m.fillRect(0,0,width,height);
    } else if (selection.shape === 'paint') {
      m.save(); m.strokeStyle='#fff'; m.fillStyle='#fff'; m.lineCap='round'; m.lineJoin='round';
      for(const stroke of (selection.strokes||[])) { if(!stroke.points?.length)continue; m.lineWidth=Math.max(1,(stroke.width||.03)*Math.min(width,height)); m.beginPath(); m.moveTo(stroke.points[0].x*width,stroke.points[0].y*height); for(let i=1;i<stroke.points.length;i++)m.lineTo(stroke.points[i].x*width,stroke.points[i].y*height); if(stroke.points.length===1)m.lineTo(stroke.points[0].x*width+.5,stroke.points[0].y*height+.5); m.stroke(); }
      m.restore();
    } else { m.fillStyle='#fff'; selectionPath(m,selection,width,height); m.fill(); }
    if (feather > 0) {
      const blurred=document.createElement('canvas'); blurred.width=width; blurred.height=height; const bc=blurred.getContext('2d'); bc.filter=`blur(${clamp(feather,0,30)/100*Math.min(width,height)*.12}px)`; bc.drawImage(mask,0,0); bc.filter='none';
      if(selection.invert){const bctx=blurred.getContext('2d',{willReadFrequently:true}),image=bctx.getImageData(0,0,width,height);for(let i=3;i<image.data.length;i+=4)image.data[i]=255-image.data[i];bctx.putImageData(image,0,0);} mask.width=mask.height=1; return blurred;
    }
    if(selection.invert){const image=m.getImageData(0,0,width,height);for(let i=3;i<image.data.length;i+=4)image.data[i]=255-image.data[i];m.putImageData(image,0,0);}
    return mask;
  }

  function applySelectiveAdjustments(c, width, height) {
    const layers = (state.localAdjustments || []).filter(layer => layer.visible !== false && layer.selection);
    if (!layers.length) return;
    for (const layer of layers) {
      const a = layer.adjustments || {};
      const brightness = clamp(100 + Number(a.brightness || 0) + Number(a.exposure || 0) * .72, 5, 300);
      const contrast = clamp(100 + Number(a.contrast || 0), 0, 300);
      const saturation = clamp(100 + Number(a.saturation || 0), 0, 300);
      const hue = Number(a.hue || 0);
      const blur = clamp(Number(a.blur || 0), 0, 20);
      if (brightness === 100 && contrast === 100 && saturation === 100 && hue === 0 && blur === 0 && !(a.warmth || 0)) continue;
      const adjusted = document.createElement('canvas'); adjusted.width = width; adjusted.height = height;
      const ac = adjusted.getContext('2d');
      ac.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`;
      ac.drawImage(c.canvas, 0, 0); ac.filter = 'none';
      if (a.warmth) { ac.save(); ac.globalCompositeOperation = 'soft-light'; ac.globalAlpha = Math.abs(Number(a.warmth)) / 180; ac.fillStyle = a.warmth > 0 ? '#ff9b49' : '#5e9fff'; ac.fillRect(0, 0, width, height); ac.restore(); }
      const mask = buildSelectionMask(layer.selection, width, height, Number(layer.feather || 0));
      ac.globalCompositeOperation = 'destination-in'; ac.drawImage(mask, 0, 0);
      c.save(); c.globalAlpha = clamp(Number(layer.opacity ?? 100) / 100, 0, 1); c.drawImage(adjusted, 0, 0); c.restore();
      adjusted.width = adjusted.height = 1; mask.width = mask.height = 1;
    }
  }

  function drawSelectionPreview() {
    const canvas = ui.selectionPreview;
    if (!canvas || ui.canvas.hidden) return;
    const selection = pointerOperation?.type === 'selection' ? pointerOperation.preview : state.selection;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    canvas.hidden = !selection;
    if (!selection || !canvas.width || !canvas.height) return;
    c.save();
    c.lineWidth = Math.max(1.5, canvas.width / 700);
    c.setLineDash([Math.max(5, canvas.width / 120), Math.max(3, canvas.width / 220)]);
    c.strokeStyle = '#fff'; c.shadowColor = '#06101d'; c.shadowBlur = 3;
    selectionPath(c, selection, canvas.width, canvas.height); c.stroke();
    c.setLineDash([Math.max(5, canvas.width / 120), Math.max(3, canvas.width / 220)]);
    c.lineDashOffset = Math.max(3, canvas.width / 120); c.strokeStyle = '#13223a';
    selectionPath(c, selection, canvas.width, canvas.height); c.stroke();
    c.restore();
  }

  function drawHistogram() {
    const hist = $('liveHistogram');
    if (!hist || !sourceBitmap || activePanel !== 'adjust') return;
    const hctx = hist.getContext('2d');
    const w = hist.width, h = hist.height;
    hctx.clearRect(0, 0, w, h);
    hctx.fillStyle = '#091426'; hctx.fillRect(0, 0, w, h);
    try {
      const sample = document.createElement('canvas'); sample.width = 128; sample.height = 128;
      const sc = sample.getContext('2d', { willReadFrequently: true });
      sc.drawImage(ui.canvas, 0, 0, sample.width, sample.height);
      const data = sc.getImageData(0, 0, sample.width, sample.height).data;
      const channels = [new Uint32Array(64), new Uint32Array(64), new Uint32Array(64)];
      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 24) continue;
        channels[0][data[i] >> 2]++; channels[1][data[i + 1] >> 2]++; channels[2][data[i + 2] >> 2]++;
      }
      const peak = Math.max(1, ...channels.map(arr => Math.max(...arr)));
      hctx.globalCompositeOperation = 'screen';
      [['#ff6478',0],['#5be2a0',1],['#5b9cff',2]].forEach(([color,index]) => {
        hctx.beginPath(); hctx.moveTo(0,h);
        for(let x=0;x<64;x++){const y=h-(channels[index][x]/peak)*(h-8);hctx.lineTo(x/63*w,y);}
        hctx.lineTo(w,h);hctx.closePath();hctx.fillStyle=color+'88';hctx.fill();
      });
      hctx.globalCompositeOperation='source-over';
      hctx.strokeStyle='#ffffff16'; hctx.lineWidth=1;
      for(let i=1;i<4;i++){hctx.beginPath();hctx.moveTo(0,h*i/4);hctx.lineTo(w,h*i/4);hctx.stroke();}
      sample.width=sample.height=1;
    } catch (error) { console.debug('Histogram unavailable', error); }
  }

  function applyGeometryTransform(c, width, height) {
    const a = state.adjustments;
    const angle = Number(a.straighten || 0) * Math.PI / 180;
    const px = Number(a.perspectiveX || 0) / 100;
    const py = Number(a.perspectiveY || 0) / 100;
    const distortion = Number(a.lensDistortion || 0) / 100;
    if (Math.abs(angle) < .00001 && Math.abs(px) < .00001 && Math.abs(py) < .00001 && Math.abs(distortion) < .00001) return;
    try {
      const source = c.getImageData(0, 0, width, height);
      const src = source.data;
      const output = c.createImageData(width, height);
      const dst = output.data;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      for (let y = 0; y < height; y++) {
        const ny = ((y + .5) / height - .5) * 2;
        for (let x = 0; x < width; x++) {
          const nx = ((x + .5) / width - .5) * 2;
          let sx = nx * cos + ny * sin;
          let sy = -nx * sin + ny * cos;
          sx += px * sy * (1 - Math.min(1, Math.abs(sx))) * .48;
          sy += py * sx * (1 - Math.min(1, Math.abs(sy))) * .48;
          const radius2 = sx * sx + sy * sy;
          const factor = 1 + distortion * radius2 * .42;
          sx = sx * factor;
          sy = sy * factor;
          const fx = (sx / 2 + .5) * width - .5;
          const fy = (sy / 2 + .5) * height - .5;
          const di = (y * width + x) * 4;
          if (fx < 0 || fy < 0 || fx >= width - 1 || fy >= height - 1) { dst[di+3] = 0; continue; }
          const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
          const i00 = (y0 * width + x0) * 4, i10 = i00 + 4, i01 = i00 + width * 4, i11 = i01 + 4;
          for (let ch = 0; ch < 4; ch++) {
            const top = src[i00+ch] * (1-tx) + src[i10+ch] * tx;
            const bottom = src[i01+ch] * (1-tx) + src[i11+ch] * tx;
            dst[di+ch] = top * (1-ty) + bottom * ty;
          }
        }
      }
      c.putImageData(output, 0, 0);
    } catch (error) { console.warn('Geometry correction was skipped:', error); }
  }

  function renderToCanvas(target, maxSide = PREVIEW_MAX, includeEdits = true, outputBackground = null) {
    if (!sourceBitmap) return null;
    const oriented = getOrientedCanvas();
    const crop = state.crop;
    const sx = clamp(crop.x, 0, .999) * oriented.width;
    const sy = clamp(crop.y, 0, .999) * oriented.height;
    const sw = clamp(crop.w, .001, 1) * oriented.width;
    const sh = clamp(crop.h, .001, 1) * oriented.height;
    const scale = Math.min(1, maxSide / Math.max(sw, sh));
    const outW = Math.max(1, Math.round(sw * scale));
    const outH = Math.max(1, Math.round(sh * scale));
    target.width = outW; target.height = outH;
    const c = target.getContext('2d', { alpha: true });
    c.clearRect(0, 0, outW, outH);
    const bg = outputBackground || (state.background !== 'transparent' ? state.background : null);
    if (!includeEdits && currentBlob) {
      // Compare mode uses the same transform/crop but bypasses all creative edits.
      c.filter = 'none'; c.drawImage(oriented, sx, sy, sw, sh, 0, 0, outW, outH);
      if(bg){c.save();c.globalCompositeOperation='destination-over';c.fillStyle=bg;c.fillRect(0,0,outW,outH);c.restore();}
      return target;
    }
    c.save();
    const a = state.adjustments;
    c.filter = cssFilter();
    c.drawImage(oriented, sx, sy, sw, sh, 0, 0, outW, outH);
    c.restore();
    applyGeometryTransform(c, outW, outH);
    if (a.warmth !== 0) {
      c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = Math.abs(a.warmth) / 180;
      c.fillStyle = a.warmth > 0 ? '#ff9b49' : '#5e9fff'; c.fillRect(0, 0, outW, outH); c.restore();
    }
    applyAdvancedAdjustments(c, outW, outH);
    applyColorKey(c, outW, outH);
    if(bg){c.save();c.globalCompositeOperation='destination-over';c.fillStyle=bg;c.fillRect(0,0,outW,outH);c.restore();}
    applyCloneStrokes(c,outW,outH);
    applyRedEyeMarks(c,outW,outH);
    applySelectiveAdjustments(c, outW, outH);
    drawOverlays(c, outW, outH);
    drawFrame(c, outW, outH);
    return target;
  }

  function previewScale() {
    if (!sourceBitmap) return 1;
    const dims = currentDimensions();
    return Math.min(1, PREVIEW_MAX / Math.max(dims.width, dims.height));
  }

  function renderPreview() {
    if (!sourceBitmap) return;
    try {
      renderToCanvas(ui.canvas, PREVIEW_MAX, !compareMode);
      ui.canvas.hidden = false;
      ui.placeholder.hidden = true;
      ui.canvas.style.transform = '';
      fitCanvas(false);
      updateSelectionBox();
      drawSelectionPreview();
      updateCanvasInfo();
      drawHistogram();
    } catch (error) {
      console.error(error);
      toast('Could not render this image. Try a smaller file.');
    }
  }

  function fitCanvas(resetZoom = true) {
    if (resetZoom) zoom = 1;
    if (!sourceBitmap || ui.canvas.hidden) return;
    const stageRect = ui.stage.getBoundingClientRect();
    const maxW = Math.max(100, stageRect.width - 35);
    const maxH = Math.max(100, stageRect.height - 35);
    const scale = Math.min(maxW / ui.canvas.width, maxH / ui.canvas.height, 1);
    fitScale = scale;
    displayWidth = ui.canvas.width * scale * zoom;
    displayHeight = ui.canvas.height * scale * zoom;
    ui.canvas.style.width = `${displayWidth}px`;
    ui.canvas.style.height = `${displayHeight}px`;
    ui.canvas.style.maxWidth = zoom > 1 ? 'none' : '100%';
    ui.canvas.style.maxHeight = zoom > 1 ? 'none' : '100%';
    if (ui.selectionPreview) {
      if (ui.selectionPreview.width !== ui.canvas.width || ui.selectionPreview.height !== ui.canvas.height) { ui.selectionPreview.width = ui.canvas.width; ui.selectionPreview.height = ui.canvas.height; }
      ui.selectionPreview.style.width = `${displayWidth}px`; ui.selectionPreview.style.height = `${displayHeight}px`; ui.selectionPreview.style.maxWidth = zoom > 1 ? 'none' : '100%'; ui.selectionPreview.style.maxHeight = zoom > 1 ? 'none' : '100%';
    }
    $('zoomValue').textContent = `${Math.round(scale * zoom * 100)}%`;
  }

  function updateCanvasInfo() {
    if (!sourceBitmap) return;
    const d = currentDimensions();
    $('canvasContext').textContent = sourceName || 'Untitled image';
    $('imageDimensions').textContent = `${d.width.toLocaleString()} × ${d.height.toLocaleString()} px`;
  }

  function updateSelectionBox() {
    if (!selectedOverlayId || !sourceBitmap || ui.canvas.hidden) { ui.selection.hidden = true; return; }
    const item = state.overlays.find(x => x.id === selectedOverlayId);
    if (!item) { ui.selection.hidden = true; return; }
    const canvasRect = ui.canvas.getBoundingClientRect();
    const stageRect = ui.stage.getBoundingClientRect();
    let w, h;
    if (item.type === 'text' || item.type === 'sticker') {
      const lines = String(item.text || '').split('\n');
      const size = (item.size || .09) * Math.min(ui.canvas.width, ui.canvas.height);
      w = Math.max(size, ...lines.map(line => line.length * size * .62)) * fitScale * zoom;
      h = Math.max(size, lines.length * size * 1.2) * fitScale * zoom;
    } else {
      w = (item.w || .25) * canvasRect.width;
      h = (item.h || .18) * canvasRect.height;
    }
    const left = canvasRect.left - stageRect.left + item.x * canvasRect.width - w / 2;
    const top = canvasRect.top - stageRect.top + item.y * canvasRect.height - h / 2;
    ui.selection.style.left = `${left}px`; ui.selection.style.top = `${top}px`;
    ui.selection.style.width = `${w}px`; ui.selection.style.height = `${h}px`;
    ui.selection.hidden = false;
  }

  function snapshotState() { return clone(state); }
  function pushHistory(snapshot = snapshotState()) {
    history.push(snapshot);
    if (history.length > HISTORY_LIMIT) history.shift();
    future = [];
    updateHistoryButtons();
  }
  function restoreState(snapshot) {
    state = clone(snapshot);
    selectedOverlayId = state.overlays.some(x => x.id === selectedOverlayId) ? selectedOverlayId : null;
    state.overlays.filter(x=>x.type==='image').forEach(primeLayerImage);
    renderPreview();
    renderPanel();
    markDirty();
  }
  function updateHistoryButtons() {
    const canUndo=history.length>0, canRedo=future.length>0;
    $('undoButton').disabled=!canUndo; $('redoButton').disabled=!canRedo;
    if ($('mobileUndoButton')) $('mobileUndoButton').disabled=!canUndo;
    if ($('mobileRedoButton')) $('mobileRedoButton').disabled=!canRedo;
    if ($('mobileResetButton')) $('mobileResetButton').disabled=!sourceBitmap;
    if ($('mobileSaveButton')) $('mobileSaveButton').disabled=!sourceBitmap;
    if ($('mobileExportButton')) $('mobileExportButton').disabled=!sourceBitmap;
  }
  function undo() {
    if (!history.length) return;
    future.push(snapshotState());
    const previous = history.pop();
    restoreState(previous);
    updateHistoryButtons();
  }
  function redo() {
    if (!future.length) return;
    history.push(snapshotState());
    const next = future.pop();
    restoreState(next);
    updateHistoryButtons();
  }
  function beginHistoryTransaction() {
    if (!pointerOperation) pointerOperation = { before: snapshotState(), changed: false };
  }
  function finishHistoryTransaction() {
    if (pointerOperation && pointerOperation.changed) pushHistory(pointerOperation.before);
    pointerOperation = null;
    updateHistoryButtons();
  }
  function commitChange(before = snapshotState()) {
    pushHistory(before);
    renderPreview();
    markDirty();
    renderPanel();
  }
  function markDirty() {
    if (!sourceBitmap) return;
    changeVersion++;
    isDirty = true;
    setSaveStatus('Unsaved changes', true);
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveProject(true), 850);
  }

  async function decodeImageFile(file) {
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch { try { return await createImageBitmap(file); } catch { /* fall through to HTMLImageElement */ } }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decoding failed.')); };
      image.src = url;
    });
  }

  async function loadImageFile(file, newProject = true) {
    if (!file || !file.type.startsWith('image/')) { toast('Choose a supported image file.'); return; }
    if (file.size > 150 * 1024 * 1024) { toast('This image is over 150 MB. Please choose a smaller file.'); return; }
    try {
      const bitmap = await decodeImageFile(file);
      if (bitmap.width * bitmap.height > 100_000_000) { bitmap.close?.(); toast('This image is too large to edit safely in this browser.'); return; }
      sourceBitmap?.close?.();
      sourceBitmap = bitmap;
      currentBlob = file;
      sourceName = file.name || 'Untitled image';
      state = makeDefaultState(); layerImageCache.clear(); cloneSourcePoint=null;
      changeVersion++;
      history = []; future = []; selectedOverlayId = null; selectedMaskId = null; pointerOperation = null; activeToolMode = 'select'; orientedCache = null; orientedCacheKey = '';
      if (newProject) {
        projectId = uid(); createdAt = Date.now();
        $('projectName').value = niceName(sourceName.replace(/\.[^.]+$/, ''));
      }
      ui.editor.hidden = false; ui.welcome.hidden = true; ui.projects.hidden = true;
      ui.editor.classList.remove('panel-open');
      ui.canvas.hidden = false; ui.placeholder.hidden = true;
      $('exportButton').disabled = false; $('exportButtonTop').disabled = false;
      compareMode = false; $('compareButton').disabled = false;
      activePanel = 'adjust'; setPanelButtons(); renderPanel(); renderPreview(); updateHistoryButtons();
      isDirty = true; setSaveStatus('Saving project…', true);
      if (newProject) await saveProject(true);
      toast(`Loaded ${file.name || 'image'}`);
    } catch (error) {
      console.error(error);
      toast('This image could not be opened. Try JPEG, PNG or WebP.');
    }
  }

  async function saveProject(silent = false) {
    if (!sourceBitmap || !currentBlob || saveInProgress) return;
    saveInProgress = true;
    const savingVersion = changeVersion;
    try {
      const d = currentDimensions();
      const project = {
        id: projectId || uid(), name: niceName($('projectName').value),
        sourceName, sourceBlob: currentBlob, state: snapshotState(),
        width: d.width, height: d.height, createdAt: createdAt || Date.now(), updatedAt: Date.now()
      };
      projectId = project.id;
      if (!createdAt) createdAt = project.createdAt;
      await dbPut(project);
      if (savingVersion === changeVersion) {
        isDirty = false;
        setSaveStatus('All changes saved');
      } else {
        isDirty = true;
        setSaveStatus('Saving changes…', true);
      }
      if (!silent) toast('Project saved on this device.');
    } catch (error) {
      console.error(error);
      setSaveStatus('Save unavailable', true);
      if (!silent) toast('Could not save. Check this browser’s storage permission.');
    } finally {
      saveInProgress = false;
      if (isDirty && changeVersion !== savingVersion) { clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => saveProject(true), 600); }
    }
  }

  async function openProject(id) {
    try {
      const project = await dbGet(id);
      if (!project) { toast('Project not found.'); return; }
      const bitmap = await decodeImageFile(project.sourceBlob);
      sourceBitmap?.close?.();
      sourceBitmap = bitmap; currentBlob = project.sourceBlob; sourceName = project.sourceName || 'Image';
      projectId = project.id; createdAt = project.createdAt; state = project.state || makeDefaultState();
      // Migrate older/incomplete project data safely.
      state.adjustments = { ...DEFAULT_ADJUSTMENTS, ...(state.adjustments || {}) };
      state.curves = { ...makeDefaultCurves(), ...(state.curves || {}) };
      for(const channel of ['master','red','green','blue']) if(!Array.isArray(state.curves[channel])||state.curves[channel].length<2) state.curves[channel]=[[0,0],[255,255]];
      state.crop = { x: 0, y: 0, w: 1, h: 1, ...(state.crop || {}) };
      state.overlays ||= []; state.strokes ||= []; state.localAdjustments ||= []; state.selection ??= null; state.lut ??= null;
      state.backgroundKey = { enabled:false, color:'#ffffff', tolerance:38, softness:0, ...(state.backgroundKey || {}) };
      state.frame = { style:'none', color:'#ffffff', width:.025, matte:'#ffffff', ...(state.frame || {}) };
      if (typeof state.background !== 'string') state.background='transparent'; cloneSourcePoint=null;
      layerImageCache.clear(); state.overlays.filter(x=>x.type==='image').forEach(primeLayerImage);
      changeVersion++;
      history = []; future = []; selectedOverlayId = null; selectedMaskId = null; pointerOperation = null; activeToolMode = 'select'; orientedCache = null;
      $('projectName').value = niceName(project.name);
      ui.projects.hidden = true; ui.welcome.hidden = true; ui.editor.hidden = false;
      ui.editor.classList.remove('panel-open');
      $('exportButton').disabled = false; $('exportButtonTop').disabled = false; $('compareButton').disabled = false;
      activePanel = 'adjust'; setPanelButtons(); renderPanel(); renderPreview(); updateHistoryButtons();
      isDirty = false; setSaveStatus('All changes saved');
    } catch (error) { console.error(error); toast('Could not open this project.'); }
  }

  async function showProjects() {
    ui.welcome.hidden = true; ui.editor.hidden = true; ui.projects.hidden = false;
    ui.editor.classList.remove('panel-open');
    await renderProjects();
  }

  async function renderProjects() {
    ui.projectGrid.innerHTML = '<div class="projects-empty"><span>◌</span><b>Loading projects…</b></div>';
    try {
      const projects = await dbGetAll();
      if (!projects.length) {
        ui.projectGrid.innerHTML = '<div class="projects-empty"><span>▧</span><b>No saved projects yet</b><small>Import an image and save your first project.</small></div>';
        return;
      }
      ui.projectGrid.innerHTML = projects.map(p => {
        const thumb = URL.createObjectURL(p.sourceBlob);
        return `<article class="project-card" data-open-project="${p.id}"><div class="project-thumb"><img src="${thumb}" alt=""></div><div class="project-meta"><b>${escapeHTML(p.name)}</b><small>${p.width} × ${p.height} px · ${formatDate(p.updatedAt)}</small><div class="project-card-actions"><button type="button" data-open-project="${p.id}">Open project</button><button class="delete" type="button" data-delete-project="${p.id}">Delete</button></div></div></article>`;
      }).join('');
      ui.projectGrid.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { img.style.display = 'none'; }));
    } catch (error) {
      console.error(error);
      ui.projectGrid.innerHTML = '<div class="projects-empty"><b>Local storage is unavailable</b><small>Try a current browser with site storage enabled.</small></div>';
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function setPanelButtons() {
    document.querySelectorAll('[data-panel]').forEach(button => button.classList.toggle('active', button.dataset.panel === activePanel));
  }
  function showPanel(name) {
    activePanel = name;
    if (name === 'crop') { activeToolMode = 'crop'; ui.canvas.classList.add('interactive'); $('toolHint').textContent = 'Drag on the image to define a crop area'; }
    else if (name === 'draw') { activeToolMode = 'draw'; ui.canvas.classList.add('interactive'); $('toolHint').textContent = 'Draw directly on the photo'; }
    else if (name === 'select' && ['select-rect','select-ellipse','select-lasso','select-linear','select-radial'].includes(activeToolMode)) { ui.canvas.classList.add('interactive'); }
    else { activeToolMode = 'select'; if (sourceBitmap) ui.canvas.classList.remove('interactive'); $('toolHint').textContent = 'Select a layer or tool'; }
    setPanelButtons();
    renderPanel();
    if (window.matchMedia('(max-width: 780px)').matches) ui.editor.classList.add('panel-open');
  }
  function closeMobilePanel() { ui.editor.classList.remove('panel-open'); }

  function sliderControl(key, label, min, max, value, unit = '') {
    const pct = ((value - min) / (max - min)) * 100;
    return `<div class="control-row"><div class="control-head"><label for="range-${key}">${label}</label><span class="control-value" id="value-${key}">${value}${unit}</span></div><input class="range-input" id="range-${key}" data-adjust="${key}" type="range" min="${min}" max="${max}" step="1" value="${value}" style="--range-fill:${pct}%"></div>`;
  }

  const CUSTOM_LOOKS_KEY = 'mindiw-photo-studio-custom-looks-v1';
  function readCustomLooks() {
    try { const value=JSON.parse(localStorage.getItem(CUSTOM_LOOKS_KEY)||'[]'); return Array.isArray(value)?value.filter(item=>item&&item.id&&item.name):[]; }
    catch { return []; }
  }
  function saveCurrentLook() {
    const name=String($('customLookName')?.value||'').trim().slice(0,36);
    if(!name){toast('Give your look a name first.');$('customLookName')?.focus();return;}
    const looks=readCustomLooks();
    const look={id:uid(),name,adjustments:clone(state.adjustments),preset:state.preset||'custom',curves:clone(state.curves||makeDefaultCurves()),frame:clone(state.frame),background:state.background,backgroundKey:clone(state.backgroundKey)};
    looks.unshift(look);const limited=looks.slice(0,40);
    try{localStorage.setItem(CUSTOM_LOOKS_KEY,JSON.stringify(limited));toast(`“${name}” saved to My Looks.`);renderPanel();}
    catch(error){console.warn('Could not save custom look',error);toast('Could not save this look. Local storage may be full.');}
  }
  function applySavedLook(id) {
    const look=readCustomLooks().find(item=>item.id===id);if(!look)return;
    const before=snapshotState();state.adjustments={...DEFAULT_ADJUSTMENTS,...clone(look.adjustments||{})};state.preset=look.preset||'custom';state.curves={...makeDefaultCurves(),...clone(look.curves||{})};state.frame={...state.frame,...clone(look.frame||{})};state.background=look.background||state.background;state.backgroundKey={...state.backgroundKey,...clone(look.backgroundKey||{})};commitChange(before);toast(`“${look.name}” applied.`);
  }
  function deleteSavedLook(id) {
    const looks=readCustomLooks().filter(item=>item.id!==id);try{localStorage.setItem(CUSTOM_LOOKS_KEY,JSON.stringify(looks));renderPanel();toast('Look removed from My Looks.');}catch{toast('Could not update saved looks.');}
  }
  function renderPanel() {
    ui.panelTitle.textContent = PANEL_NAMES[activePanel] || 'Studio controls';
    if (!sourceBitmap && activePanel !== 'help') {
      ui.panel.innerHTML = '<div class="panel-empty"><div class="empty-symbol">◐</div><b>Start with an image</b><p>Import a photo to unlock the editing tools.</p><button class="action-button" data-action="import">Import image</button></div>';
      return;
    }
    const a = state.adjustments;
    if (activePanel === 'adjust') {
      ui.panel.innerHTML = `
        <div class="section-block histogram-block"><div class="section-heading"><b>LIVE HISTOGRAM</b><small>RGB · current preview</small></div><canvas id="liveHistogram" width=320 height=88 aria-label="RGB image histogram"></canvas><div class="histogram-legend"><span><i class="hist-r"></i>Red</span><span><i class="hist-g"></i>Green</span><span><i class="hist-b"></i>Blue</span></div></div>
        <div class="section-block"><div class="section-heading"><b>LIGHT</b><small>Balance the exposure</small></div>
          ${sliderControl('brightness','Brightness',-100,100,a.brightness)}
          ${sliderControl('exposure','Exposure',-100,100,a.exposure)}
          ${sliderControl('contrast','Contrast',-100,100,a.contrast)}
        </div>
        <div class="section-block"><div class="section-heading"><b>COLOR</b><small>Shape the mood</small></div>
          ${sliderControl('saturation','Saturation',-100,100,a.saturation)}
          ${sliderControl('warmth','Temperature',-100,100,a.warmth)}
          ${sliderControl('hue','Hue',-180,180,a.hue,'°')}
        </div>
        <div class="section-block"><div class="section-heading"><b>DETAIL</b><small>Lens softness</small></div>
          ${sliderControl('blur','Blur',0,20,a.blur,' px')}
          ${sliderControl('highlights','Highlights',-100,100,a.highlights)}
          ${sliderControl('shadows','Shadows',-100,100,a.shadows)}
          ${sliderControl('whites','Whites',-100,100,a.whites)}
          ${sliderControl('blacks','Blacks',-100,100,a.blacks)}
          ${sliderControl('vibrance','Vibrance',-100,100,a.vibrance)}
        </div>
        <div class="section-block"><div class="section-heading"><b>TONE CURVE</b><small>Three-point tonal shaping</small></div>${sliderControl('toneCurveShadows','Shadows',-100,100,a.toneCurveShadows)}${sliderControl('toneCurveMidtones','Midtones',-100,100,a.toneCurveMidtones)}${sliderControl('toneCurveHighlights','Highlights',-100,100,a.toneCurveHighlights)}<p class="control-help">Lift or deepen tonal zones with smooth luminance weighting.</p></div>
        <div class="section-block"><div class="section-heading"><b>SPLIT TONING</b><small>Cool shadows · warm highlights</small></div>${sliderControl('splitShadows','Shadow tint',0,100,a.splitShadows)}${sliderControl('splitHighlights','Highlight tint',0,100,a.splitHighlights)}${sliderControl('splitBalance','Tonal balance',-100,100,a.splitBalance)}<p class="control-help">Teal shadows and amber highlights with adjustable balance.</p></div>
        <div class="section-block"><div class="section-heading"><b>HSL MIXER</b><small>Target individual color ranges</small></div>${HSL_CHANNELS.map(([name])=>`<details class="hsl-channel"><summary>${name}</summary>${sliderControl(`hsl${name}Hue`,`${name} hue`, -100,100,a[`hsl${name}Hue`])}${sliderControl(`hsl${name}Sat`,`${name} saturation`,-100,100,a[`hsl${name}Sat`])}${sliderControl(`hsl${name}Lum`,`${name} luminance`,-100,100,a[`hsl${name}Lum`])}</details>`).join('')}</div>
        <div class="section-block"><div class="section-heading"><b>LEVELS</b><small>Set black point, white point and gamma</small></div>
          ${sliderControl('inputBlack','Input black',0,100,a.inputBlack)}${sliderControl('inputWhite','Input white',155,255,a.inputWhite)}${sliderControl('gamma','Midtone gamma',25,400,a.gamma,'%')}${sliderControl('outputBlack','Output black',0,100,a.outputBlack)}${sliderControl('outputWhite','Output white',155,255,a.outputWhite)}
          <p class="control-help">Levels remap the tonal range before the point curves. Use this to set clean blacks and whites without flattening the image.</p>
        </div>
        <div class="section-block curve-section"><div class="section-heading"><b>POINT CURVES</b><small>Master and individual RGB channels</small></div>
          <div class="curve-toolbar"><select class="form-select" id="curveChannel" aria-label="Curve channel"><option value="master" ${activeCurveChannel==='master'?'selected':''}>RGB master</option><option value="red" ${activeCurveChannel==='red'?'selected':''}>Red channel</option><option value="green" ${activeCurveChannel==='green'?'selected':''}>Green channel</option><option value="blue" ${activeCurveChannel==='blue'?'selected':''}>Blue channel</option></select><button class="action-button compact" data-action="reset-curve">Reset channel</button></div>
          <canvas id="curveEditorCanvas" class="curve-editor-canvas" width="280" height="280" aria-label="Interactive RGB tone curve editor"></canvas>
          <div class="curve-axis-caption"><span>Shadows</span><span>Input → Output</span><span>Highlights</span></div>
          <p class="control-help">Tap or click to add a point, drag points to shape the curve. Endpoints stay anchored. Up to ten points per channel.</p>
        </div>
        <div class="section-block"><div class="section-heading"><b>DETAIL ENHANCEMENT</b><small>Local pixel processing</small></div>${sliderControl('sharpen','Sharpen',0,100,a.sharpen)}${sliderControl('noiseReduction','Noise reduction',0,100,a.noiseReduction)}<p class="control-help">These pixel-level controls can increase processing time on large images.</p></div>
        <div class="action-grid"><button class="action-button" data-action="auto-adjust">Auto tone</button><button class="action-button" data-action="reset-adjust">Reset adjustments</button></div>
        <p class="control-help">Adjustments are non-destructive until export. Use Undo to step back through edits.</p>`;
    } else if (activePanel === 'filters') {
      const names = [['original','Original'],['warm','Golden hour'],['cool','Cool tone'],['cinema','Cinema'],['mono','Monochrome'],['vintage','Vintage'],['vivid','Vivid'],['fade','Soft fade'],['portrait','Portrait'],['dramatic','Dramatic'],['pastel','Pastel'],['teal','Teal mood'],['noir','Noir'],['bleach','Bleach bypass'],['soft','Soft glow']];
      const customLooks=readCustomLooks();
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>CREATIVE PRESETS</b><small>Tap to apply</small></div><div class="preset-grid">${names.map(([key,name]) => `<button class="preset-card ${state.preset === key ? 'active' : ''}" data-preset="${key}"><div class="preset-art ${key}"></div><span>${name}</span></button>`).join('')}</div></div><div class="action-grid"><button class="action-button" data-action="reset-adjust">Remove filter</button><button class="action-button" data-action="random-preset">Surprise me</button></div><p class="control-help">Presets are starting points. Fine-tune them in Adjust.</p><div class="section-block"><div class="section-heading"><b>MY LOOKS</b><small>${customLooks.length}/40 saved</small></div><div class="custom-look-save"><input class="form-input" id="customLookName" maxlength="36" placeholder="Name this look" aria-label="Custom look name"><button class="action-button" data-action="save-custom-look">Save current look</button></div>${customLooks.length?`<div class="custom-look-list">${customLooks.map(look=>`<div class="custom-look-row"><button class="custom-look-load" data-custom-look="${escapeHTML(look.id)}"><b>${escapeHTML(look.name)}</b><small>Saved colour and tone settings</small></button><button class="custom-look-delete" data-custom-look-delete="${escapeHTML(look.id)}" title="Delete ${escapeHTML(look.name)}" aria-label="Delete ${escapeHTML(look.name)}">×</button></div>`).join('')}</div>`:'<p class="control-help">Save a favourite colour treatment and reuse it on another photo.</p>'}</div>`;
    } else if (activePanel === 'crop') {
      const d = currentDimensions();
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>ASPECT RATIO</b><small>${d.width} × ${d.height}</small></div><div class="crop-ratios">${[['free','Free'],['1:1','1:1'],['4:5','4:5'],['5:4','5:4'],['3:4','3:4'],['4:3','4:3'],['2:3','2:3'],['3:2','3:2'],['5:7','5:7'],['8:10','8:10'],['16:9','16:9'],['9:16','9:16'],['21:9','21:9'],['2:1','2:1'],['3:1','3:1']].map(([key,label]) => `<button class="ratio-btn ${cropRatio===key?'active':''}" data-ratio="${key}">${label}</button>`).join('')}</div><p class="control-help">Choose a ratio (social, print or screen), then drag on the image. The crop is committed when you release.</p></div>
        <div class="section-block"><div class="section-heading"><b>TRANSFORM</b><small>Rotate and flip</small></div><div class="action-grid"><button class="action-button" data-action="rotate-left">↶ Rotate left</button><button class="action-button" data-action="rotate-right">↷ Rotate right</button><button class="action-button" data-action="flip-x">⇋ Flip horizontal</button><button class="action-button" data-action="flip-y">⇵ Flip vertical</button></div>
          ${sliderControl('straighten','Straighten',-15,15,a.straighten,'°')}
          ${sliderControl('perspectiveX','Horizontal perspective',-100,100,a.perspectiveX)}
          ${sliderControl('perspectiveY','Vertical perspective',-100,100,a.perspectiveY)}
          ${sliderControl('lensDistortion','Lens distortion',-100,100,a.lensDistortion)}
          <p class="control-help">Correct tilted horizons, keystone distortion and barrel/pincushion lens shape. Geometry is rendered at export resolution.</p></div>
        <div class="action-grid"><button class="action-button" data-action="reset-crop">Reset crop</button><button class="action-button" data-action="reset-transform">Reset transform</button></div>`;
    } else if (activePanel === 'select') {
      const selection = state.selection;
      const masks = state.localAdjustments || [];
      const selectedMask = masks.find(layer => layer.id === selectedMaskId) || null;
      const maskRows = masks.map(layer => `<div class="mask-layer ${layer.id===selectedMaskId?'active':''}"><button class="mask-layer-main" data-mask-action="select" data-mask-id="${layer.id}"><span class="mask-layer-icon">◩</span><span><b>${escapeHTML(layer.name || 'Selective adjustment')}</b><small>${layer.selection?.shape || 'mask'} · ${layer.visible===false?'Hidden':'Visible'}</small></span></button><button class="mask-mini" data-mask-action="toggle" data-mask-id="${layer.id}" title="Toggle visibility">${layer.visible===false?'○':'◉'}</button><button class="mask-mini danger" data-mask-action="delete" data-mask-id="${layer.id}" title="Delete mask">×</button></div>`).join('');
      ui.panel.innerHTML = `
        <div class="section-block"><div class="section-heading"><b>SELECTION TOOLS</b><small>Draw a precise region</small></div>
          <div class="action-grid"><button class="action-button ${activeToolMode==='select-rect'?'selected':''}" data-action="selection-rect">▭ Rectangle</button><button class="action-button ${activeToolMode==='select-ellipse'?'selected':''}" data-action="selection-ellipse">◯ Ellipse</button><button class="action-button ${activeToolMode==='select-lasso'?'selected':''}" data-action="selection-lasso">⌁ Free lasso</button><button class="action-button ${activeToolMode==='select-linear'?'selected':''}" data-action="selection-linear">◩ Linear gradient</button><button class="action-button ${activeToolMode==='select-radial'?'selected':''}" data-action="selection-radial">◉ Radial gradient</button><button class="action-button ${activeToolMode==='select-brush'?'selected':''}" data-action="selection-brush">🖌 Selection brush</button><button class="action-button ${activeToolMode==='magic'?'selected':''}" data-action="selection-magic">✧ Magic wand</button><button class="action-button" data-action="invert-selection">⇄ Invert selection</button></div>
          <div class="section-subtools"><label class="field-label" for="magicTolerance">Magic wand tolerance <b id="magicToleranceValue">${magicTolerance}</b></label><input class="range-input" id="magicTolerance" type="range" min="1" max="160" value="${magicTolerance}" data-selection-option="tolerance"><label class="toggle-check"><input id="magicContiguous" type="checkbox" data-selection-option="contiguous" ${magicContiguous?'checked':''}> Select connected pixels only</label></div><div class="mask-status">${selection ? `Active ${selection.shape} selection · ${Math.round((selection.w||selection.bounds?.w||0)*(selection.h||selection.bounds?.h||0)*100)}% bounding area` : 'No active selection. Choose a tool and drag on the image.'}</div>
          <div class="control-row"><div class="control-head"><label>Selection feather</label><span class="control-value" id="value-selectionFeather">${selection?.feather||0}%</span></div><input class="range-input" type="range" min="0" max="30" value="${selection?.feather||0}" data-mask-range="selectionFeather" ${selection?'':'disabled'}></div>
          <div class="action-grid"><button class="action-button" data-action="clear-selection">Clear selection</button><button class="action-button" data-action="create-mask" ${selection?'':'disabled'}>＋ Create local mask</button></div>
        </div>
        <div class="section-block"><div class="section-heading"><b>ADJUSTMENT MASKS</b><small>${masks.length} local layer(s)</small></div><div class="mask-layer-list">${maskRows || '<div class="workspace-hint">No masks yet. Create a selection, then add a local adjustment mask.</div>'}</div></div>
        ${selectedMask ? `<div class="section-block"><div class="section-heading"><b>${escapeHTML(selectedMask.name || 'Selective adjustment')}</b><small>Non-destructive</small></div>
          <div class="control-row"><div class="control-head"><label>Brightness</label><span class="control-value" id="value-maskBrightness">${selectedMask.adjustments?.brightness||0}</span></div><input class="range-input" type="range" min="-100" max="100" value="${selectedMask.adjustments?.brightness||0}" data-mask-range="brightness" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Exposure</label><span class="control-value" id="value-maskExposure">${selectedMask.adjustments?.exposure||0}</span></div><input class="range-input" type="range" min="-100" max="100" value="${selectedMask.adjustments?.exposure||0}" data-mask-range="exposure" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Contrast</label><span class="control-value" id="value-maskContrast">${selectedMask.adjustments?.contrast||0}</span></div><input class="range-input" type="range" min="-100" max="100" value="${selectedMask.adjustments?.contrast||0}" data-mask-range="contrast" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Saturation</label><span class="control-value" id="value-maskSaturation">${selectedMask.adjustments?.saturation||0}</span></div><input class="range-input" type="range" min="-100" max="100" value="${selectedMask.adjustments?.saturation||0}" data-mask-range="saturation" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Temperature</label><span class="control-value" id="value-maskWarmth">${selectedMask.adjustments?.warmth||0}</span></div><input class="range-input" type="range" min="-100" max="100" value="${selectedMask.adjustments?.warmth||0}" data-mask-range="warmth" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Local blur</label><span class="control-value" id="value-maskBlur">${selectedMask.adjustments?.blur||0} px</span></div><input class="range-input" type="range" min="0" max="20" value="${selectedMask.adjustments?.blur||0}" data-mask-range="blur" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Mask feather</label><span class="control-value" id="value-maskFeather">${selectedMask.feather??0}%</span></div><input class="range-input" type="range" min="0" max="30" value="${selectedMask.feather??0}" data-mask-range="feather" data-mask-id="${selectedMask.id}"></div>
          <div class="control-row"><div class="control-head"><label>Layer opacity</label><span class="control-value" id="value-maskOpacity">${selectedMask.opacity??100}%</span></div><input class="range-input" type="range" min="0" max="100" value="${selectedMask.opacity??100}" data-mask-range="opacity" data-mask-id="${selectedMask.id}"></div>
          <div class="action-grid"><button class="action-button" data-mask-action="invert" data-mask-id="${selectedMask.id}">⇄ Invert mask</button><button class="action-button" data-mask-action="duplicate" data-mask-id="${selectedMask.id}">Duplicate mask</button></div>
        </div>` : ''}
        <p class="control-help">Local adjustments affect only the masked region. Masks remain editable and are included in project saves and exports.</p>`;
    } else if (activePanel === 'color') {
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>COLOR GRADING</b><small>Fine colour balance</small></div>
        ${sliderControl('warmth','Temperature',-100,100,a.warmth)}${sliderControl('tint','Tint',-100,100,a.tint)}${sliderControl('vibrance','Vibrance',-100,100,a.vibrance)}${sliderControl('saturation','Saturation',-100,100,a.saturation)}${sliderControl('hue','Hue',-180,180,a.hue,'°')}
        <div class="action-grid"><button class="action-button" data-action="auto-adjust">✦ Auto tone</button><button class="action-button" data-action="reset-adjust">Reset color</button></div></div><div class="section-block"><div class="section-heading"><b>3D LUT LOOKS</b><small>${state.lut?.title ? escapeHTML(state.lut.title) : 'Import a .cube colour lookup'}</small></div><div class="action-grid"><button class="action-button" data-action="import-lut">＋ Load .cube LUT</button><button class="action-button" data-action="clear-lut" ${state.lut?'':'disabled'}>Remove LUT</button></div><p class="control-help">3D .cube lookup tables are applied locally. Larger LUTs are resampled to a 17³ working grid to keep projects responsive.</p></div>
        <div class="section-block"><div class="section-heading"><b>LIGHT BALANCE</b><small>Recover detail</small></div>${sliderControl('highlights','Highlights',-100,100,a.highlights)}${sliderControl('shadows','Shadows',-100,100,a.shadows)}${sliderControl('whites','Whites',-100,100,a.whites)}${sliderControl('blacks','Blacks',-100,100,a.blacks)}</div>
        <div class="section-block"><div class="section-heading"><b>3-WAY COLOR BALANCE</b><small>Cyan–red · magenta–green · yellow–blue</small></div>
          <details class="hsl-channel"><summary>Shadows</summary>${sliderControl('shadowCyanRed','Cyan ↔ Red',-100,100,a.shadowCyanRed)}${sliderControl('shadowMagentaGreen','Magenta ↔ Green',-100,100,a.shadowMagentaGreen)}${sliderControl('shadowYellowBlue','Yellow ↔ Blue',-100,100,a.shadowYellowBlue)}</details>
          <details class="hsl-channel"><summary>Midtones</summary>${sliderControl('midtoneCyanRed','Cyan ↔ Red',-100,100,a.midtoneCyanRed)}${sliderControl('midtoneMagentaGreen','Magenta ↔ Green',-100,100,a.midtoneMagentaGreen)}${sliderControl('midtoneYellowBlue','Yellow ↔ Blue',-100,100,a.midtoneYellowBlue)}</details>
          <details class="hsl-channel"><summary>Highlights</summary>${sliderControl('highlightCyanRed','Cyan ↔ Red',-100,100,a.highlightCyanRed)}${sliderControl('highlightMagentaGreen','Magenta ↔ Green',-100,100,a.highlightMagentaGreen)}${sliderControl('highlightYellowBlue','Yellow ↔ Blue',-100,100,a.highlightYellowBlue)}</details>
        </div>
        <div class="section-block"><div class="section-heading"><b>RGB CHANNEL MIXER</b><small>Remap source channels into each output</small></div>
          <details class="hsl-channel"><summary>Red output</summary>${sliderControl('mixRedR','Red source',-100,200,a.mixRedR)}${sliderControl('mixRedG','Green source',-100,200,a.mixRedG)}${sliderControl('mixRedB','Blue source',-100,200,a.mixRedB)}</details>
          <details class="hsl-channel"><summary>Green output</summary>${sliderControl('mixGreenR','Red source',-100,200,a.mixGreenR)}${sliderControl('mixGreenG','Green source',-100,200,a.mixGreenG)}${sliderControl('mixGreenB','Blue source',-100,200,a.mixGreenB)}</details>
          <details class="hsl-channel"><summary>Blue output</summary>${sliderControl('mixBlueR','Red source',-100,200,a.mixBlueR)}${sliderControl('mixBlueG','Green source',-100,200,a.mixBlueG)}${sliderControl('mixBlueB','Blue source',-100,200,a.mixBlueB)}</details>
          <p class="control-help">The identity mix is 100% of its matching channel and 0% of the others. Strong cross-channel values can clip highlights and shadows.</p>
        </div>
        <div class="section-block"><div class="section-heading"><b>SELECTIVE COLOR</b><small>CMYK corrections by color range</small></div>
          ${[['Red','Reds'],['Yellow','Yellows'],['Green','Greens'],['Cyan','Cyans'],['Blue','Blues'],['Magenta','Magentas'],['White','Whites'],['Neutral','Neutrals'],['Black','Blacks']].map(([key,label])=>`<details class="hsl-channel"><summary>${label}</summary>${sliderControl(`sel${key}C`,'Cyan',-100,100,a[`sel${key}C`])}${sliderControl(`sel${key}M`,'Magenta',-100,100,a[`sel${key}M`])}${sliderControl(`sel${key}Y`,'Yellow',-100,100,a[`sel${key}Y`])}${sliderControl(`sel${key}K`,'Black',-100,100,a[`sel${key}K`])}</details>`).join('')}
          <p class="control-help">Adjust cyan, magenta, yellow and black contribution in targeted colour and tonal ranges.</p></div>`;
    } else if (activePanel === 'effects') {
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>CREATIVE EFFECTS</b><small>Finishing look</small></div>${sliderControl('clarity','Clarity / micro contrast',-100,100,a.clarity)}${sliderControl('vignette','Vignette',0,100,a.vignette)}${sliderControl('grain','Film grain',0,100,a.grain)}${sliderControl('sepia','Sepia tone',0,100,a.sepia)}${sliderControl('blur','Lens blur',0,20,a.blur,' px')}${sliderControl('sharpen','Sharpen',0,100,a.sharpen)}${sliderControl('noiseReduction','Noise reduction',0,100,a.noiseReduction)}${sliderControl('texture','Texture',-100,100,a.texture)}${sliderControl('dehaze','Dehaze',0,100,a.dehaze)}${sliderControl('pixelate','Mosaic / pixelate',0,100,a.pixelate)}${sliderControl('posterize','Posterize',0,100,a.posterize)}${sliderControl('glow','Soft glow',0,100,a.glow)}${sliderControl('chromaticShift','Chromatic aberration',0,100,a.chromaticShift)}</div>
        <div class="section-block"><div class="section-heading"><b>BATCH PROCESSING</b><small>Apply this look to multiple photos</small></div><div class="action-grid"><button class="action-button" data-action="batch-process">▧ Choose multiple photos</button></div><p class="control-help">Applies the current global adjustments, colour LUT, colour key and frame to each selected image. Existing photos and projects are left unchanged.</p></div><div class="section-block"><div class="section-heading"><b>QUICK EFFECTS</b><small>Tap to apply</small></div><div class="action-grid"><button class="action-button" data-action="effect-vignette">Cinematic vignette</button><button class="action-button" data-action="effect-film">Film look</button><button class="action-button" data-action="effect-mono">Black & white</button><button class="action-button" data-action="reset-adjust">Clear effects</button></div></div>`;
    } else if (activePanel === 'retouch') {
      const key=state.backgroundKey||{enabled:false,color:'#ffffff',tolerance:38,softness:0};
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>BACKGROUND COLOR KEY</b><small>Remove a selected solid colour</small></div>
        <p class="control-help">Select a background colour with the eyedropper or choose a colour. This is colour-based removal, not AI subject detection.</p>
        <label class="field-label" for="keyColor">Key colour</label><div class="form-columns"><input class="color-control" id="keyColor" type="color" value="${safeColor(key.color)}" data-key-field="color"><button class="action-button" data-action="pick-key-color">⌖ Pick from photo</button></div>
        ${sliderControl('keyTolerance','Tolerance',0,180,key.tolerance)}${sliderControl('keySoftness','Edge softness',0,100,key.softness)}
        <div class="action-grid"><button class="action-button ${key.enabled?'selected':''}" data-action="toggle-color-key">${key.enabled?'✓ Color key enabled':'Enable color key'}</button><button class="action-button" data-action="disable-color-key">Disable</button></div></div>
        <div class="section-block"><div class="section-heading"><b>HEALING & CLONING</b><small>Repair small imperfections</small></div><div class="action-grid"><button class="action-button" data-action="set-heal-source">＋ Set healing source</button><button class="action-button ${activeToolMode==='heal'?'selected':''}" data-action="toggle-heal">Healing brush</button><button class="action-button" data-action="set-clone-source">＋ Set clone source</button><button class="action-button ${activeToolMode==='clone'?'selected':''}" data-action="toggle-clone">Clone stamp</button></div><p class="control-help">Healing blends sampled texture with nearby tone. Clone copies pixels directly. Both work best on small repairs and repeatable textures.</p><div class="control-row"><div class="control-head"><label>Brush size</label><span class="control-value" id="retouchBrushValue">${brushSize}px</span></div><input class="range-input" type="range" min="2" max="120" value="${brushSize}" data-brush="size"></div><div class="control-row"><div class="control-head"><label>Brush opacity</label><span class="control-value" id="retouchOpacityValue">${Math.round(brushOpacity*100)}%</span></div><input class="range-input" type="range" min="5" max="100" value="${Math.round(brushOpacity*100)}" data-brush="opacity"></div></div>
        <div class="section-block"><div class="section-heading"><b>RED-EYE REDUCTION</b><small>Click the red pupil</small></div><button class="action-button ${activeToolMode==='red-eye'?'selected':''}" data-action="toggle-red-eye" style="width:100%">${activeToolMode==='red-eye'?'✓ Red-eye tool active':'◉ Remove red eye'}</button><p class="control-help">Tap or click a red pupil. The tool reduces red pixels inside the brush area; review the result and undo if needed.</p></div>
        <div class="section-block"><div class="section-heading"><b>ERASER / BRUSH</b><small>Touch, mouse or stylus</small></div><div class="action-grid"><button class="action-button" data-action="toggle-erase">⌫ ${activeToolMode==='erase'?'Stop erasing':'Erase on canvas'}</button><button class="action-button" data-action="toggle-draw">✎ Draw mode</button><button class="action-button ${activeToolMode==='dodge'?'selected':''}" data-action="toggle-dodge">☼ Dodge</button><button class="action-button ${activeToolMode==='burn'?'selected':''}" data-action="toggle-burn">◐ Burn</button></div><p class="control-help">Use the eraser to erase brush marks. Use a transparent PNG if you need transparent erase results.</p></div>`;
    } else if (activePanel === 'frames') {
      const f=state.frame||{style:'none',color:'#ffffff',width:.025,matte:'#ffffff'};
      const frameItems=[['none','No frame','□'],['thin','Classic','▣'],['double','Double line','▣'],['soft','Soft edge','▤'],['black','Black matte','▣'],['polaroid','Polaroid','▧'],['film','Film strip','▥']];
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>FRAME PRESETS</b><small>Aspect ratio stays unchanged</small></div><div class="preset-grid">${frameItems.map(([id,name,ico])=>`<button class="preset-card ${f.style===id?'active':''}" data-frame="${id}"><div class="frame-preview ${id}">${ico}</div><span>${name}</span></button>`).join('')}</div></div>
        <div class="section-block"><div class="section-heading"><b>FRAME STYLE</b><small>Customize edge</small></div><div class="form-columns"><div><label class="field-label" for="frameColor">Frame color</label><input class="color-control" id="frameColor" type="color" value="${safeColor(f.color)}" data-frame-field="color"></div><div><label class="field-label" for="frameMatte">Matte color</label><input class="color-control" id="frameMatte" type="color" value="${safeColor(f.matte)}" data-frame-field="matte"></div></div>${sliderControl('frameWidth','Frame width',1,10,Math.round((f.width||.025)*100))}</div>`;
    } else if (activePanel === 'background') {
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>CANVAS BACKGROUND</b><small>Visible through transparent areas</small></div><div class="action-grid"><button class="action-button" data-bgcolor="transparent">Transparent</button><button class="action-button" data-bgcolor="#ffffff">White</button><button class="action-button" data-bgcolor="#000000">Black</button><button class="action-button" data-bgcolor="#101a2c">Midnight</button></div><label class="field-label" for="customBackground">Custom background</label><input class="color-control" id="customBackground" type="color" value="${safeColor(state.background==='transparent'?'#ffffff':state.background)}" data-background-color></div>
        <div class="section-block"><div class="section-heading"><b>CANVAS SIZES</b><small>Use crop for exact framing</small></div><div class="action-grid"><button class="action-button" data-action="canvas-square">Square 1080</button><button class="action-button" data-action="canvas-story">Story 1080×1920</button><button class="action-button" data-action="canvas-landscape">Landscape 1920×1080</button><button class="action-button" data-action="canvas-portrait">Portrait 1080×1350</button></div></div>`;
    } else if (activePanel === 'text') {
      const selected = selectedItem();
      const item = selected && (selected.type === 'text' || selected.type === 'sticker') ? selected : null;
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>ADD TYPOGRAPHY</b><small>Editable layers</small></div><div class="action-grid"><button class="action-button" data-action="add-text">＋ Add text layer</button><button class="action-button" data-action="add-sticker">✦ Add sticker</button></div><p class="control-help">New text appears in the centre. Drag it on the canvas to position it.</p></div>
        ${item ? `<div class="section-block"><div class="section-heading"><b>TEXT PROPERTIES</b><small>Selected layer</small></div><label class="field-label" for="layerText">Text content</label><textarea class="form-textarea" id="layerText" data-layer-field="text">${escapeHTML(item.text || '')}</textarea><div class="form-columns"><div><label class="field-label" for="textColor">Color</label><input class="color-control" id="textColor" type="color" data-layer-field="color" value="${safeColor(item.color)}"></div><div><label class="field-label" for="textStroke">Outline</label><input class="color-control" id="textStroke" type="color" data-layer-field="stroke" value="${safeColor(item.stroke || '#152018')}"></div></div><div class="control-row"><div class="control-head"><label for="textSize">Size</label><span class="control-value" id="value-layer-size">${Math.round(item.size * 100)}%</span></div><input class="range-input" id="textSize" data-layer-range="size" type="range" min="3" max="28" value="${Math.round(item.size * 100)}"></div><div class="control-row"><div class="control-head"><label for="textOpacity">Opacity</label><span class="control-value" id="value-layer-opacity">${Math.round((item.opacity ?? 1)*100)}%</span></div><input class="range-input" id="textOpacity" data-layer-range="opacity" type="range" min="5" max="100" value="${Math.round((item.opacity ?? 1)*100)}"></div><div class="control-row"><div class="control-head"><label for="textRotation">Rotation</label><span class="control-value" id="value-layer-rotation">${item.rotation || 0}°</span></div><input class="range-input" id="textRotation" data-layer-range="rotation" type="range" min="-180" max="180" value="${item.rotation || 0}"></div><label class="field-label" for="textFont">Typeface</label><select class="form-select" id="textFont" data-layer-field="font"><option ${item.font==='Arial, sans-serif'?'selected':''} value="Arial, sans-serif">Modern Sans</option><option ${item.font==='Georgia, serif'?'selected':''} value="Georgia, serif">Classic Serif</option><option ${item.font==='Impact, sans-serif'?'selected':''} value="Impact, sans-serif">Display Bold</option><option ${item.font==='monospace'?'selected':''} value="monospace">Mono</option></select><label class="field-label" for="textAlign" style="margin-top:10px">Alignment</label><select class="form-select" id="textAlign" data-layer-field="align"><option value="left" ${item.align==='left'?'selected':''}>Left</option><option value="center" ${(item.align||'center')==='center'?'selected':''}>Center</option><option value="right" ${item.align==='right'?'selected':''}>Right</option></select><div class="control-row"><div class="control-head"><label>Letter spacing</label><span class="control-value" id="value-layer-letterSpacing">${item.letterSpacing||0} px</span></div><input class="range-input" type="range" min="-2" max="18" value="${item.letterSpacing||0}" data-layer-range="letterSpacing"></div><div class="control-row"><div class="control-head"><label>Line height</label><span class="control-value" id="value-layer-lineHeight">${Number(item.lineHeight||1.2).toFixed(1)}×</span></div><input class="range-input" type="range" min="80" max="240" value="${Math.round((item.lineHeight||1.2)*100)}" data-layer-range="lineHeight"></div><label class="field-label" for="textShadowColor">Shadow colour</label><input class="color-control" id="textShadowColor" type="color" data-layer-field="shadowColor" value="${safeColor(item.shadowColor||'#000000')}"><div class="control-row"><div class="control-head"><label>Shadow softness</label><span class="control-value" id="value-layer-shadowBlur">${item.shadowBlur||0} px</span></div><input class="range-input" type="range" min="0" max="45" value="${item.shadowBlur||0}" data-layer-range="shadowBlur"></div><div class="action-grid" style="margin-top:10px"><button class="action-button" data-action="toggle-bold">${item.bold===false?'Make bold':'Regular weight'}</button><button class="action-button" data-action="delete-selected">Delete layer</button></div></div>` : '<div class="workspace-hint">Select a text layer in Layers to edit its content, typeface, color and scale.</div>'}`;
    } else if (activePanel === 'shapes') {
      const selected = selectedItem();
      const shape = selected && ['rect','circle','line','arrow','gradient'].includes(selected.type) ? selected : null;
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>ADD ELEMENT</b><small>Vector shapes</small></div><div class="action-grid"><button class="action-button" data-action="add-rect">▭ Rectangle</button><button class="action-button" data-action="add-circle">◯ Ellipse</button><button class="action-button" data-action="add-line">／ Line</button><button class="action-button" data-action="add-arrow">➜ Arrow</button><button class="action-button" data-action="add-gradient">◩ Gradient overlay</button><button class="action-button" data-action="add-photo-layer">▧ Add photo layer</button></div></div>
        ${shape ? `<div class="section-block"><div class="section-heading"><b>SHAPE STYLE</b><small>Selected element</small></div><label class="field-label" for="shapeColor">Fill / line color</label><input class="color-control" id="shapeColor" type="color" data-layer-field="color" value="${safeColor(shape.color)}"><label class="field-label" for="shapeStroke" style="margin-top:11px">Outline color</label><input class="color-control" id="shapeStroke" type="color" data-layer-field="stroke" value="${safeColor(shape.stroke || '#ffffff')}">${shape.type==='gradient'?`<label class="field-label" for="gradientColor2">Second colour</label><input class="color-control" id="gradientColor2" type="color" data-layer-field="color2" value="${safeColor(shape.color2||'#5178c8')}"><div class="control-row"><div class="control-head"><label>Gradient angle</label><span class="control-value" id="value-layer-angle">${shape.angle||0}°</span></div><input class="range-input" type="range" min="-180" max="180" value="${shape.angle||0}" data-layer-range="angle"></div>`:''}<div class="control-row"><div class="control-head"><label for="shapeWidth">Width</label><span class="control-value" id="value-layer-width">${Math.round((shape.w ?? .28)*100)}%</span></div><input class="range-input" id="shapeWidth" data-layer-range="width" type="range" min="5" max="95" value="${Math.round((shape.w ?? .28)*100)}"></div><div class="control-row"><div class="control-head"><label for="shapeHeight">Height</label><span class="control-value" id="value-layer-height">${Math.round((shape.h ?? .2)*100)}%</span></div><input class="range-input" id="shapeHeight" data-layer-range="height" type="range" min="5" max="95" value="${Math.round((shape.h ?? .2)*100)}"></div><div class="control-row"><div class="control-head"><label for="shapeOpacity">Opacity</label><span class="control-value" id="value-layer-opacity">${Math.round((shape.opacity ?? 1)*100)}%</span></div><input class="range-input" id="shapeOpacity" data-layer-range="opacity" type="range" min="5" max="100" value="${Math.round((shape.opacity ?? 1)*100)}"></div><div class="control-row"><div class="control-head"><label for="shapeRotation">Rotation</label><span class="control-value" id="value-layer-rotation">${shape.rotation || 0}°</span></div><input class="range-input" id="shapeRotation" data-layer-range="rotation" type="range" min="-180" max="180" value="${shape.rotation || 0}"></div><div class="action-grid"><button class="action-button" data-action="toggle-fill">${shape.fill===false?'Enable fill':'Outline only'}</button><button class="action-button" data-action="delete-selected">Delete layer</button></div></div>` : '<div class="workspace-hint">Select a shape from the canvas or Layers to change its fill, outline and opacity.</div>'}`;
    } else if (activePanel === 'draw') {
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>FREEHAND BRUSH</b><small>Draw on image</small></div><button class="action-button ${activeToolMode==='draw'?'selected':''}" data-action="toggle-draw" style="width:100%;height:40px">${activeToolMode==='draw'?'✓ Drawing mode active':'✎ Enable drawing mode'}</button><p class="control-help">Draw directly over your image with mouse, pen or touch. Each stroke can be undone.</p><label class="field-label" for="brushColor">Brush color</label><input class="color-control" id="brushColor" type="color" value="${brushColor}" data-brush="color"><div class="control-row"><div class="control-head"><label for="brushSize">Brush size</label><span class="control-value" id="brushSizeValue">${brushSize}px</span></div><input class="range-input" id="brushSize" type="range" min="1" max="80" value="${brushSize}" data-brush="size"></div><div class="control-row"><div class="control-head"><label for="brushOpacity">Brush opacity</label><span class="control-value" id="brushOpacityValue">${Math.round(brushOpacity*100)}%</span></div><input class="range-input" id="brushOpacity" type="range" min="5" max="100" value="${Math.round(brushOpacity*100)}" data-brush="opacity"></div><div class="action-grid"><button class="action-button" data-action="clear-drawings">Clear all strokes</button><button class="action-button" data-action="toggle-draw">${activeToolMode==='draw'?'Stop drawing':'Start drawing'}</button></div></div><div class="workspace-hint">Tip: use a stylus for pressure-independent smooth strokes. Brush width is scaled to your export dimensions.</div>`;
    } else if (activePanel === 'layers') {
      const rows = state.overlays.map((item, index) => `<div class="layer-item ${item.id===selectedOverlayId?'active':''}" data-layer-id="${item.id}"><div class="layer-thumb">${item.type==='image'?'▧':item.type==='text'?'T':item.type==='sticker'?'✦':item.type==='circle'?'◯':item.type==='line'?'／':item.type==='arrow'?'➜':item.type==='gradient'?'◩':'▭'}</div><div class="layer-copy"><b>${escapeHTML(item.name || (item.type==='text'?'Text layer':`${item.type} layer`))}</b><small>${item.visible===false?'Hidden':item.type.toUpperCase()}</small></div><div class="layer-actions"><button data-layer-action="toggle" data-layer-id="${item.id}" title="Show or hide">${item.visible===false?'○':'◉'}</button><button data-layer-action="up" data-layer-id="${item.id}" title="Move forward">↑</button><button data-layer-action="down" data-layer-id="${item.id}" title="Move backward">↓</button><button data-layer-action="duplicate" data-layer-id="${item.id}" title="Duplicate layer">▣</button><button data-layer-action="delete" data-layer-id="${item.id}" title="Delete">×</button></div></div>`).reverse().join('');
      const layer=selectedItem(); const imageLayer=layer&&layer.type==='image'?layer:null; const blendOptions=[['normal','Normal'],['multiply','Multiply'],['screen','Screen'],['overlay','Overlay'],['darken','Darken'],['lighten','Lighten'],['color-dodge','Color dodge'],['color-burn','Color burn'],['hard-light','Hard light'],['soft-light','Soft light'],['difference','Difference'],['exclusion','Exclusion'],['hue','Hue'],['saturation','Saturation'],['color','Color'],['luminosity','Luminosity'],['lighter','Lighter']];
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>CREATIVE LAYERS</b><small>${state.overlays.length} layer(s)</small></div><div class="action-grid"><button class="action-button" data-action="add-photo-layer">＋ Add photo layer</button><button class="action-button" data-action="add-text">＋ Add text</button></div><div class="layer-list">${rows || '<div class="workspace-hint">No layers yet. Add a photo, text or shape to build a composition.</div>'}</div></div>${imageLayer?`<div class="section-block"><div class="section-heading"><b>PHOTO LAYER</b><small>Selected image</small></div><div class="control-row"><div class="control-head"><label>Width</label><span class="control-value" id="value-layer-width">${Math.round(imageLayer.w*100)}%</span></div><input class="range-input" type="range" min="5" max="100" value="${Math.round(imageLayer.w*100)}" data-layer-range="width"></div><div class="control-row"><div class="control-head"><label>Height</label><span class="control-value" id="value-layer-height">${Math.round(imageLayer.h*100)}%</span></div><input class="range-input" type="range" min="5" max="100" value="${Math.round(imageLayer.h*100)}" data-layer-range="height"></div><div class="control-row"><div class="control-head"><label>Opacity</label><span class="control-value" id="value-layer-opacity">${Math.round(imageLayer.opacity*100)}%</span></div><input class="range-input" type="range" min="5" max="100" value="${Math.round(imageLayer.opacity*100)}" data-layer-range="opacity"></div><div class="control-row"><div class="control-head"><label>Rotation</label><span class="control-value" id="value-layer-rotation">${imageLayer.rotation||0}°</span></div><input class="range-input" type="range" min="-180" max="180" value="${imageLayer.rotation||0}" data-layer-range="rotation"></div><label class="toggle-check"><input type="checkbox" data-image-layer-field="aspectLocked" ${imageLayer.aspectLocked?'checked':''}> Keep proportions</label><div class="action-grid"><button class="action-button" data-action="toggle-image-shadow">${imageLayer.shadow?'Remove':'Add'} shadow</button><button class="action-button" data-action="delete-selected">Delete layer</button></div></div>`:''}${layer?`<div class="section-block"><div class="section-heading"><b>LAYER BLENDING</b><small>Composite mode</small></div><label class="field-label" for="layerBlendMode">Blend mode</label><select class="form-select" id="layerBlendMode" data-layer-field="blendMode">${blendOptions.map(([value,label])=>`<option value="${value}" ${(layer.blendMode||'normal')===value?'selected':''}>${label}</option>`).join('')}</select><p class="control-help">Blend modes change how the selected layer combines with the image below.</p></div>`:''}<div class="section-block"><div class="section-heading"><b>DRAWING</b><small>${state.strokes.length} stroke(s)</small></div><div class="action-grid"><button class="action-button" data-action="toggle-draw">✎ ${activeToolMode==='draw'?'Stop drawing':'Draw on image'}</button><button class="action-button" data-action="clear-drawings">Clear strokes</button></div></div><div class="workspace-hint">Layer order runs from bottom to top. Use the arrows to change the stacking order.</div>`;
    } else {
      ui.panel.innerHTML = `<div class="section-block"><div class="section-heading"><b>QUICK GUIDE</b></div><div class="workspace-hint"><b>Import</b><br>Start from the home screen, use Import image or drop a photo onto the canvas.</div><div class="workspace-hint" style="margin-top:8px"><b>Move objects</b><br>Select Text, Shapes or Layers, then drag an object directly on the image.</div><div class="workspace-hint" style="margin-top:8px"><b>Crop</b><br>Choose a ratio and drag on the photo. The crop is applied when you release.</div><div class="workspace-hint" style="margin-top:8px"><b>Save & export</b><br>Projects auto-save locally. Export creates a new PNG, JPEG or WebP file.</div></div><div class="section-block"><div class="section-heading"><b>KEYBOARD SHORTCUTS</b></div><div class="kbd-list"><div>Undo <kbd>Ctrl</kbd> + <kbd>Z</kbd></div><div>Redo <kbd>Ctrl</kbd> + <kbd>Y</kbd></div><div>Save <kbd>Ctrl</kbd> + <kbd>S</kbd></div><div>Import <kbd>Ctrl</kbd> + <kbd>O</kbd></div><div>Brush <kbd>B</kbd></div><div>Magic wand <kbd>W</kbd></div><div>Delete selected <kbd>Delete</kbd></div><div>Rectangle selection <kbd>M</kbd></div><div>Lasso selection <kbd>L</kbd></div><div>Close tools <kbd>Esc</kbd></div></div></div><div class="workspace-hint">All editing and project data stay in this browser on this device. Exported files are saved through your browser’s download flow.</div>`;
    }
    if (activePanel === 'adjust') requestAnimationFrame(drawCurveEditor);
  }

  function safeColor(value) { return /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#ffffff'; }
  let activeToolMode = 'select';
  let brushColor = '#ffffff';
  let brushSize = 8;
  let brushOpacity = 1;
  let cloneSourcePoint = null;
  let magicTolerance = 34;
  let magicContiguous = true;
  let cropRatio = 'free';
  let batchDirectoryHandle = null;

  function startSelectionTool(shape) {
    if (!sourceBitmap) { toast('Import an image before making a selection.'); return; }
    activeToolMode = shape === 'brush' ? 'select-brush' : `select-${shape}`;
    ui.canvas.classList.add('interactive');
    $('toolHint').textContent = shape === 'brush' ? 'Paint over the area you want to select' : shape === 'lasso' ? 'Trace around the subject with your finger, mouse or pen' : shape==='linear' ? 'Drag to set the direction of the linear mask' : shape==='radial' ? 'Drag from the focus point to set the radial mask radius' : `Drag to create an ${shape} selection`;
    closeMobilePanel();
    renderPanel();
  }

  function createLocalMask() {
    if (!state.selection) { toast('Create a selection first.'); return; }
    const before = snapshotState();
    const n = (state.localAdjustments || []).length + 1;
    const mask = { id: uid(), name: `Local adjustment ${n}`, visible: true, opacity: 100, feather: state.selection.feather || 0, selection: clone(state.selection), adjustments: { brightness: 0, exposure: 0, contrast: 0, saturation: 0, warmth: 0, hue: 0, blur: 0 } };
    state.localAdjustments ||= []; state.localAdjustments.push(mask); selectedMaskId = mask.id;
    state.selection = null; activeToolMode = 'select'; ui.canvas.classList.remove('interactive');
    commitChange(before); showPanel('select'); toast('Local adjustment mask created.');
  }

  function selectedItem() { return state.overlays.find(item => item.id === selectedOverlayId) || null; }
  function primeLayerImage(item) {
    if(!item || item.type!=='image' || !item.src) return Promise.resolve(false);
    const cached=layerImageCache.get(item.id); if(cached?.complete&&cached.naturalWidth)return Promise.resolve(true);
    if(cached?.__ready)return cached.__ready;
    const img=new Image();
    img.__ready=new Promise(resolve=>{img.onload=()=>{renderPreview();resolve(true);};img.onerror=()=>{console.warn('Could not decode a photo layer.');resolve(false);};});
    layerImageCache.set(item.id,img); img.src=item.src; return img.__ready;
  }
  async function addPhotoLayer(file) {
    if(!file || !file.type.startsWith('image/')) return;
    if(file.size>60*1024*1024){toast('Photo layer is over 60 MB. Choose a smaller image.');return;}
    try{
      const bitmap=await decodeImageFile(file), maxSide=1800, scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
      const photoW=Math.max(1,Math.round(bitmap.width*scale)), photoH=Math.max(1,Math.round(bitmap.height*scale));
      const c=document.createElement('canvas'); c.width=photoW; c.height=photoH;
      c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height); bitmap.close?.();
      let src=c.toDataURL('image/webp',.88); if(!src.startsWith('data:image/webp'))src=c.toDataURL('image/png'); c.width=c.height=1;
      const base=currentDimensions(), photoRatio=photoW/photoH, baseRatio=base.width/base.height;
      let layerW=.44, layerH=layerW*baseRatio/photoRatio; if(layerH>.62){layerH=.62;layerW=layerH*photoRatio/baseRatio;}
      const before=snapshotState(), item={id:uid(),type:'image',name:file.name||'Photo layer',src,x:.5,y:.5,w:layerW,h:layerH,aspect:layerW/layerH,aspectLocked:true,opacity:1,rotation:0,visible:true,shadow:true,radius:0,border:''};
      state.overlays.push(item); selectedOverlayId=item.id; await primeLayerImage(item); commitChange(before); showPanel('layers'); toast('Photo layer added. Drag it to position it.');
    }catch(error){console.error(error);toast('Could not add this image layer.');}
  }
  function addOverlay(type) {
    const before = snapshotState();
    const common = { id: uid(), type, x: .5, y: .5, w: type==='gradient'?.82:.28, h: type==='gradient'?.82:.2, color: '#9be36c', stroke: '#f4f7f2', opacity: 1, rotation: 0, visible: true, fill: true, outline: true, strokeWidth: .004 };
    const item = type === 'text' ? { ...common, name: 'Text layer', text: 'Your title', color: '#ffffff', stroke: '#172218', size: .095, font: 'Arial, sans-serif', bold: true, align: 'center', letterSpacing: 0, lineHeight: 1.2, shadowBlur: 0, shadowColor: '#000000' } : type === 'sticker' ? { ...common, name: 'Sticker', text: '✦', color: '#c5f28d', size: .15, stroke: 'none' } : type === 'gradient' ? { ...common, name: 'Gradient overlay', color: '#f2a65a', color2: '#5178c8', angle: 0, blendMode: 'soft-light', opacity: .38, fill: true, outline: false } : { ...common, name: `${type[0].toUpperCase()}${type.slice(1)} layer`, fill: type !== 'line' && type !== 'arrow' };
    state.overlays.push(item);
    selectedOverlayId = item.id;
    commitChange(before);
    if (type === 'text' || type === 'sticker') showPanel('text'); else showPanel('shapes');
    toast(`${item.name} added. Drag it on the image to position.`);
  }

  function deleteSelected() {
    if (!selectedOverlayId) return;
    const before = snapshotState();
    state.overlays = state.overlays.filter(item => item.id !== selectedOverlayId);
    layerImageCache.delete(selectedOverlayId);
    selectedOverlayId = null;
    commitChange(before);
  }

  function calculateAutoTone() {
    if (!sourceBitmap) return { brightness: 0, contrast: 0, saturation: 0, exposure: 0 };
    try {
      const oriented = getOrientedCanvas();
      const sample = document.createElement('canvas'); sample.width = 96; sample.height = 96;
      const c = sample.getContext('2d', { willReadFrequently: true });
      const crop = state.crop;
      c.drawImage(oriented, crop.x * oriented.width, crop.y * oriented.height, crop.w * oriented.width, crop.h * oriented.height, 0, 0, 96, 96);
      const pixels = c.getImageData(0, 0, 96, 96).data;
      let sum = 0, sum2 = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        if (pixels[i + 3] < 20) continue;
        const lum = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
        sum += lum; sum2 += lum * lum; count++;
      }
      const mean = count ? sum / count : .5;
      const deviation = count ? Math.sqrt(Math.max(0, sum2 / count - mean * mean)) : .2;
      return {
        brightness: Math.round(clamp((.49 - mean) * 58, -24, 24)),
        exposure: Math.round(clamp((.48 - mean) * 30, -18, 18)),
        contrast: Math.round(clamp((.24 - deviation) * 75, -12, 18)),
        saturation: 4
      };
    } catch (error) { console.warn('Auto tone analysis unavailable:', error); return { brightness: 4, contrast: 6, saturation: 5, exposure: 2 }; }
  }

  function applyPreset(name) {
    if (!PRESETS[name]) return;
    const before = snapshotState();
    state.adjustments = { ...DEFAULT_ADJUSTMENTS, ...PRESETS[name] };
    state.preset = name;
    commitChange(before);
    toast(`${name[0].toUpperCase()}${name.slice(1)} look applied.`);
  }

  function remapSelection(selection, mapper) {
    if (!selection) return selection;
    if (selection.shape === 'linear' || selection.shape === 'radial') {
      const start=mapper(selection.start||{x:selection.x,y:selection.y}), end=mapper(selection.end||selection.start||{x:selection.x,y:selection.y});
      return { ...selection, start, end, x:Math.min(start.x,end.x), y:Math.min(start.y,end.y), w:Math.abs(end.x-start.x), h:Math.abs(end.y-start.y) };
    }
    const points = selection.points?.length ? selection.points : [
      {x:selection.x,y:selection.y},{x:selection.x+selection.w,y:selection.y},
      {x:selection.x+selection.w,y:selection.y+selection.h},{x:selection.x,y:selection.y+selection.h}
    ];
    const mapped = points.map(mapper);
    if (selection.shape === 'lasso' && selection.points?.length) return { ...selection, points: mapped,
      x:Math.min(...mapped.map(p=>p.x)), y:Math.min(...mapped.map(p=>p.y)),
      w:Math.max(...mapped.map(p=>p.x))-Math.min(...mapped.map(p=>p.x)),
      h:Math.max(...mapped.map(p=>p.y))-Math.min(...mapped.map(p=>p.y)) };
    const xs=mapped.map(p=>p.x), ys=mapped.map(p=>p.y);
    return { ...selection, x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xs)-Math.min(...xs), h:Math.max(...ys)-Math.min(...ys) };
  }

  function mapAllMasks(mapper) {
    if (state.selection) state.selection = remapSelection(state.selection, mapper);
    for (const layer of state.localAdjustments || []) if (layer.selection) layer.selection = remapSelection(layer.selection, mapper);
  }

  function remapMasksForCrop(oldCrop, newCrop) {
    const mapper = point => ({ x:clamp((oldCrop.x + point.x * oldCrop.w - newCrop.x) / newCrop.w, 0, 1), y:clamp((oldCrop.y + point.y * oldCrop.h - newCrop.y) / newCrop.h, 0, 1) });
    mapAllMasks(mapper);
  }

  function changeTransform(action) {
    const before = snapshotState();
    if (action === 'rotate-left') { mapAllMasks(p => ({x:p.y,y:1-p.x})); state.rotation = (state.rotation + 270) % 360; }
    if (action === 'rotate-right') { mapAllMasks(p => ({x:1-p.y,y:p.x})); state.rotation = (state.rotation + 90) % 360; }
    if (action === 'flip-x') { mapAllMasks(p => ({x:1-p.x,y:p.y})); state.flipX = !state.flipX; }
    if (action === 'flip-y') { mapAllMasks(p => ({x:p.x,y:1-p.y})); state.flipY = !state.flipY; }
    if (action === 'reset-transform') {
      const turn = ((state.rotation % 360) + 360) % 360;
      const flipX = state.flipX, flipY = state.flipY;
      mapAllMasks(point => {
        let q = { ...point };
        if (turn === 90) q = { x: point.y, y: 1 - point.x };
        else if (turn === 180) q = { x: 1 - point.x, y: 1 - point.y };
        else if (turn === 270) q = { x: 1 - point.y, y: point.x };
        if (flipX) q.x = 1 - q.x;
        if (flipY) q.y = 1 - q.y;
        return q;
      });
      state.rotation = 0; state.flipX = false; state.flipY = false;
    }
    if (action === 'reset-crop') {
      const oldCrop = { ...state.crop };
      remapMasksForCrop(oldCrop, { x: 0, y: 0, w: 1, h: 1 });
      state.crop = { x: 0, y: 0, w: 1, h: 1 };
    }
    orientedCache = null; orientedCacheKey = '';
    commitChange(before);
  }

  function applyRatio(ratio) {
    cropRatio = ratio;
    document.querySelectorAll('[data-ratio]').forEach(btn => btn.classList.toggle('active', btn.dataset.ratio === ratio));
    if (ratio === 'free' || !sourceBitmap) {
      activeToolMode = 'crop';
      $('toolHint').textContent = 'Drag on the image to choose a crop area';
      ui.canvas.classList.add('interactive');
      toast('Drag on the photo to define your crop.');
      if(window.matchMedia('(max-width: 780px)').matches) closeMobilePanel();
      return;
    }
    const oldCrop = { ...state.crop };
    const target = ratio.split(':').map(Number).reduce((x, y) => x / y);
    // Calculate ratio against the transformed source's pixel dimensions.
    const dims = currentDimensions();
    const currentCropW = state.crop.w * dims.orientedWidth;
    const currentCropH = state.crop.h * dims.orientedHeight;
    let newW = currentCropW, newH = currentCropH;
    if (currentCropW / currentCropH > target) newW = currentCropH * target; else newH = currentCropW / target;
    state.crop.x += (currentCropW - newW) / 2 / dims.orientedWidth;
    state.crop.y += (currentCropH - newH) / 2 / dims.orientedHeight;
    state.crop.w = newW / dims.orientedWidth;
    state.crop.h = newH / dims.orientedHeight;
    remapMasksForCrop(oldCrop, { ...state.crop });
    renderPreview(); markDirty();
    activeToolMode = 'crop'; ui.canvas.classList.add('interactive');
    $('toolHint').textContent = 'Drag to refine the crop selection';
    if(window.matchMedia('(max-width: 780px)').matches) closeMobilePanel();
    toast(`${ratio} crop ratio selected.`);
  }

  function onPanelClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const action = actionButton.dataset.action;
      switch (action) {
        case 'import': ui.file.click(); break;
        case 'add-text': addOverlay('text'); break;
        case 'add-sticker': addOverlay('sticker'); break;
        case 'add-photo-layer': $('overlayFileInput').click(); break;
        case 'import-lut': $('lutInput').click(); break;
        case 'save-custom-look': saveCurrentLook(); break;
        case 'reset-curve': { const before=snapshotState(); state.curves ||= makeDefaultCurves(); state.curves[activeCurveChannel]=[[0,0],[255,255]]; commitChange(before); toast(`${activeCurveChannel.toUpperCase()} curve reset.`); break; }
        case 'clear-lut': { const before=snapshotState();state.lut=null;commitChange(before);toast('Colour LUT removed.');break; }
        case 'batch-process': chooseBatchFiles(); break;
        case 'toggle-image-shadow': { const item=selectedItem(); if(item&&item.type==='image'){const before=snapshotState();item.shadow=!item.shadow;commitChange(before);} break; }
        case 'add-rect': addOverlay('rect'); break;
        case 'add-circle': addOverlay('circle'); break;
        case 'add-line': addOverlay('line'); break;
        case 'add-arrow': addOverlay('arrow'); break;
        case 'add-gradient': addOverlay('gradient'); break;
        case 'toggle-draw': activeToolMode = activeToolMode === 'draw' ? 'select' : 'draw'; ui.canvas.classList.toggle('interactive', activeToolMode === 'draw' || activeToolMode === 'erase'); $('toolHint').textContent = activeToolMode === 'draw' ? 'Draw directly on the photo' : 'Select a layer or tool'; renderPanel(); break;
        case 'toggle-dodge': case 'toggle-burn': { const mode=action==='toggle-dodge'?'dodge':'burn'; activeToolMode=activeToolMode===mode?'select':mode; ui.canvas.classList.toggle('interactive',activeToolMode===mode); $('toolHint').textContent=activeToolMode===mode?`Paint to ${mode} local areas`:'Select a tool to continue'; renderPanel(); if(window.matchMedia('(max-width: 780px)').matches)closeMobilePanel(); break; }
        case 'toggle-erase': activeToolMode = activeToolMode === 'erase' ? 'select' : 'erase'; ui.canvas.classList.toggle('interactive', activeToolMode === 'erase'); $('toolHint').textContent = activeToolMode === 'erase' ? 'Erase brush marks on the image' : 'Select a layer or tool'; renderPanel(); break;
        case 'set-heal-source': activeToolMode='heal-sample'; ui.canvas.classList.add('interactive'); $('toolHint').textContent='Tap a clean texture to sample for healing'; closeMobilePanel(); toast('Choose a nearby clean source area.'); break;
        case 'toggle-heal': if(!cloneSourcePoint){activeToolMode='heal-sample';$('toolHint').textContent='Tap a clean source point';toast('Choose a source point first.');}else{activeToolMode=activeToolMode==='heal'?'select':'heal';$('toolHint').textContent=activeToolMode==='heal'?'Paint over a small blemish':'Select a tool to continue';} ui.canvas.classList.toggle('interactive',activeToolMode==='heal'||activeToolMode==='heal-sample');renderPanel();if(window.matchMedia('(max-width: 780px)').matches)closeMobilePanel();break;
        case 'toggle-red-eye': activeToolMode=activeToolMode==='red-eye'?'select':'red-eye';ui.canvas.classList.toggle('interactive',activeToolMode==='red-eye');$('toolHint').textContent=activeToolMode==='red-eye'?'Tap a red pupil to reduce the red reflection':'Select a tool to continue editing';renderPanel();if(window.matchMedia('(max-width: 780px)').matches)closeMobilePanel();break;
        case 'set-clone-source': activeToolMode='clone-sample'; ui.canvas.classList.add('interactive'); $('toolHint').textContent='Tap a clean source area'; closeMobilePanel(); toast('Tap the part of the photo to sample.'); break;
        case 'toggle-clone': if(!cloneSourcePoint){activeToolMode='clone-sample';$('toolHint').textContent='Tap a clean source area';toast('First choose a source point on the photo.');}else{activeToolMode=activeToolMode==='clone'?'select':'clone';$('toolHint').textContent=activeToolMode==='clone'?'Paint over the area to retouch':'Select a tool to continue editing';} ui.canvas.classList.toggle('interactive',activeToolMode==='clone'||activeToolMode==='clone-sample');renderPanel();if(window.matchMedia('(max-width: 780px)').matches)closeMobilePanel();break;
        case 'pick-key-color': activeToolMode='eyedropper'; $('toolHint').textContent='Tap the image to sample a background colour'; ui.canvas.classList.add('interactive'); closeMobilePanel(); toast('Tap a colour in the photo to sample it.'); break;
        case 'toggle-color-key': { const before=snapshotState(); state.backgroundKey.enabled=!state.backgroundKey.enabled; commitChange(before); break; }
        case 'disable-color-key': { const before=snapshotState(); state.backgroundKey.enabled=false; commitChange(before); break; }
        case 'effect-vignette': { const before=snapshotState(); state.adjustments.vignette=55; commitChange(before); break; }
        case 'effect-film': { const before=snapshotState(); state.adjustments={...state.adjustments,grain:18,contrast:12,saturation:-12,warmth:12}; commitChange(before); break; }
        case 'effect-mono': applyPreset('mono'); break;
        case 'canvas-square': case 'canvas-story': case 'canvas-landscape': case 'canvas-portrait': { const r=action==='canvas-square'?'1:1':action==='canvas-story'?'9:16':action==='canvas-landscape'?'16:9':'4:5'; const before=snapshotState(); applyRatio(r); pushHistory(before); updateHistoryButtons(); markDirty(); break; }
        case 'clear-drawings': { const before = snapshotState(); state.strokes = []; commitChange(before); break; }
        case 'selection-rect': startSelectionTool('rect'); break;
        case 'selection-ellipse': startSelectionTool('ellipse'); break;
        case 'selection-lasso': startSelectionTool('lasso'); break;
        case 'selection-linear': startSelectionTool('linear'); break;
        case 'selection-radial': startSelectionTool('radial'); break;
        case 'selection-brush': startSelectionTool('brush'); break;
        case 'selection-magic': if(sourceBitmap){activeToolMode='magic';ui.canvas.classList.add('interactive');$('toolHint').textContent='Click a colour area to select connected pixels';closeMobilePanel();toast('Click a colour area in the image.');} break;
        case 'create-mask': createLocalMask(); break;
        case 'clear-selection': { if(state.selection){const before=snapshotState();state.selection=null;commitChange(before);toast('Selection cleared.');} break; }
        case 'invert-selection': { if(state.selection){const before=snapshotState();state.selection.invert=!state.selection.invert;commitChange(before);toast(state.selection.invert?'Selection inverted.':'Selection restored.');} break; }
        case 'delete-selected': deleteSelected(); break;
        case 'toggle-bold': { const item = selectedItem(); if (item) { const before = snapshotState(); item.bold = item.bold === false; commitChange(before); } break; }
        case 'toggle-fill': { const item = selectedItem(); if (item) { const before = snapshotState(); item.fill = item.fill === false; commitChange(before); } break; }
        case 'rotate-left': case 'rotate-right': case 'flip-x': case 'flip-y': case 'reset-transform': case 'reset-crop': changeTransform(action); break;
        case 'reset-adjust': { const before = snapshotState(); state.adjustments = { ...DEFAULT_ADJUSTMENTS }; state.preset = 'original'; commitChange(before); break; }
        case 'auto-adjust': { const before = snapshotState(); state.adjustments = { ...state.adjustments, ...calculateAutoTone() }; state.preset = 'custom'; commitChange(before); toast('Auto tone analysed the photo and balanced light and contrast.'); break; }
        case 'random-preset': { const names = Object.keys(PRESETS).filter(k => k !== 'original'); applyPreset(names[Math.floor(Math.random() * names.length)]); break; }
      }
      return;
    }
    const customLook=event.target.closest('[data-custom-look]');
    if(customLook){applySavedLook(customLook.dataset.customLook);return;}
    const deleteLook=event.target.closest('[data-custom-look-delete]');
    if(deleteLook){deleteSavedLook(deleteLook.dataset.customLookDelete);return;}
    const preset = event.target.closest('[data-preset]');
    if (preset) { applyPreset(preset.dataset.preset); return; }
    const frame = event.target.closest('[data-frame]');
    if(frame){ const before=snapshotState(); state.frame.style=frame.dataset.frame; commitChange(before); return; }
    const bg = event.target.closest('[data-bgcolor]');
    if(bg){ const before=snapshotState(); state.background=bg.dataset.bgcolor; commitChange(before); return; }
    const ratio = event.target.closest('[data-ratio]');
    if (ratio) {
      const before = snapshotState();
      applyRatio(ratio.dataset.ratio);
      if (ratio.dataset.ratio !== 'free') { history.push(before); future = []; updateHistoryButtons(); markDirty(); }
      return;
    }
    const maskAction = event.target.closest('[data-mask-action]');
    if (maskAction) {
      const id = maskAction.dataset.maskId;
      const mask = (state.localAdjustments || []).find(layer => layer.id === id);
      if (!mask) return;
      const before = snapshotState();
      switch (maskAction.dataset.maskAction) {
        case 'select': selectedMaskId = id; renderPanel(); break;
        case 'toggle': mask.visible = mask.visible === false; commitChange(before); break;
        case 'delete': state.localAdjustments = state.localAdjustments.filter(layer => layer.id !== id); if (selectedMaskId === id) selectedMaskId = null; commitChange(before); break;
        case 'invert': mask.selection.invert = !mask.selection.invert; commitChange(before); break;
        case 'duplicate': { const copy = clone(mask); copy.id = uid(); copy.name = `${mask.name} copy`; state.localAdjustments.push(copy); selectedMaskId = copy.id; commitChange(before); break; }
      }
      return;
    }
    const layerAction = event.target.closest('[data-layer-action]');
    if (layerAction) {
      const id = layerAction.dataset.layerId; const item = state.overlays.find(x => x.id === id); if (!item) return;
      const before = snapshotState(); const index = state.overlays.indexOf(item);
      if (layerAction.dataset.layerAction === 'toggle') item.visible = item.visible === false;
      if (layerAction.dataset.layerAction === 'delete') { state.overlays.splice(index, 1); layerImageCache.delete(id); if (selectedOverlayId === id) selectedOverlayId = null; }
      if (layerAction.dataset.layerAction === 'up' && index < state.overlays.length - 1) { state.overlays.splice(index, 1); state.overlays.splice(index + 1, 0, item); }
      if (layerAction.dataset.layerAction === 'down' && index > 0) { state.overlays.splice(index, 1); state.overlays.splice(index - 1, 0, item); }
      if (layerAction.dataset.layerAction === 'duplicate') { const copy=clone(item);copy.id=uid();copy.name=`${item.name||item.type} copy`;copy.x=clamp((item.x??.5)+.025,.02,.98);copy.y=clamp((item.y??.5)+.025,.02,.98);state.overlays.push(copy);selectedOverlayId=copy.id;if(copy.type==='image')primeLayerImage(copy); }
      commitChange(before); return;
    }
    const layerItem = event.target.closest('.layer-item');
    if (layerItem && !event.target.closest('.layer-actions')) {
      selectedOverlayId = layerItem.dataset.layerId; renderPreview(); renderPanel(); return;
    }
  }

  function onPanelInput(event) {
    if(event.target.id==='curveChannel'){activeCurveChannel=event.target.value;drawCurveEditor();return;}
    const selectionOption=event.target.dataset.selectionOption;
    if(selectionOption==='tolerance'){magicTolerance=Number(event.target.value);const out=$('magicToleranceValue');if(out)out.textContent=String(magicTolerance);return;}
    if(selectionOption==='contiguous'){magicContiguous=event.target.checked;return;}
    const adjust = event.target.dataset.adjust;
    if (adjust) {
      const value = Number(event.target.value);
      if (adjust === 'keyTolerance') state.backgroundKey.tolerance = value;
      else if (adjust === 'keySoftness') state.backgroundKey.softness = value;
      else if (adjust === 'frameWidth') state.frame.width = value / 100;
      else { state.adjustments[adjust] = value; state.preset = 'custom'; }
      if (pointerOperation) pointerOperation.changed = true;
      const val = $(`value-${adjust}`); if (val) val.textContent = `${value}${adjust === 'hue' ? '°' : adjust === 'blur' ? ' px' : adjust === 'frameWidth' || adjust === 'gamma' ? '%' : ''}`;
      const pct = ((value - Number(event.target.min)) / (Number(event.target.max) - Number(event.target.min))) * 100;
      event.target.style.setProperty('--range-fill', `${pct}%`);
      renderPreview(); markDirty();
      return;
    }
    const maskRange = event.target.dataset.maskRange;
    if (maskRange) {
      const layer = (state.localAdjustments || []).find(item => item.id === (event.target.dataset.maskId || selectedMaskId));
      if (maskRange === 'selectionFeather') {
        if (state.selection) state.selection.feather = Number(event.target.value);
      } else if (layer) {
        if (maskRange === 'feather') layer.feather = Number(event.target.value);
        else if (maskRange === 'opacity') layer.opacity = Number(event.target.value);
        else { layer.adjustments ||= {}; layer.adjustments[maskRange] = Number(event.target.value); }
      }
      const label = event.target.closest('.control-row')?.querySelector('.control-value');
      if (label) label.textContent = `${event.target.value}${['feather','opacity','selectionFeather'].includes(maskRange) ? '%' : maskRange==='blur' ? ' px' : ''}`;
      if (pointerOperation) pointerOperation.changed = true;
      renderPreview(); markDirty(); return;
    }
    const imageLayerField=event.target.dataset.imageLayerField;
    if(imageLayerField){const item=selectedItem();if(item&&item.type==='image'){item[imageLayerField]=event.target.checked; if(imageLayerField==='aspectLocked' && item.aspect){if(item.aspectLocked)item.height=clamp(item.width/item.aspect,.04,1);}renderPreview();markDirty();}return;}
    const keyField=event.target.dataset.keyField;
    if(keyField){ state.backgroundKey[keyField]=event.target.value; if(keyField==='tolerance'||keyField==='softness')state.backgroundKey[keyField]=Number(event.target.value); renderPreview(); markDirty(); return; }
    const frameField=event.target.dataset.frameField;
    if(frameField){ state.frame[frameField]=event.target.value; renderPreview(); markDirty(); return; }
    if(event.target.hasAttribute('data-background-color')){ state.background=event.target.value; renderPreview(); markDirty(); return; }
    const field = event.target.dataset.layerField;
    if (field) {
      const item = selectedItem(); if (!item) return;
      item[field] = event.target.value;
      renderPreview(); updateSelectionBox(); markDirty();
      return;
    }
    const layerRange = event.target.dataset.layerRange;
    if (layerRange) {
      const item = selectedItem(); if (!item) return;
      const val = Number(event.target.value);
      item[layerRange] = ['size','opacity','width','height'].includes(layerRange) ? val / 100 : layerRange==='lineHeight' ? val/100 : val;
      if(item.type==='image' && item.aspectLocked && ['width','height'].includes(layerRange)){
        if(layerRange==='width')item.height=clamp(item.width/item.aspect,.04,1); else item.width=clamp(item.height*item.aspect,.04,1);
      }
      if (pointerOperation) pointerOperation.changed = true;
      const label = $(`value-layer-${layerRange}`); if (label) label.textContent = `${layerRange==='lineHeight' ? `${(val/100).toFixed(2)}×` : `${val}${['size','opacity','width','height'].includes(layerRange) ? '%' : ['rotation','angle'].includes(layerRange) ? '°' : ['letterSpacing','shadowBlur'].includes(layerRange) ? ' px' : ''}`}`;
      if(item.type==='image' && item.aspectLocked){const other=layerRange==='width'?'height':'width';const otherLabel=$(`value-layer-${other}`);if(otherLabel)otherLabel.textContent=`${Math.round(item[other]*100)}%`;}
      renderPreview(); updateSelectionBox(); markDirty();
      return;
    }
    const brush = event.target.dataset.brush;
    if (brush === 'color') brushColor = event.target.value;
    if (brush === 'size') { brushSize = Number(event.target.value); const a=$('brushSizeValue'),b=$('retouchBrushValue');if(a)a.textContent=`${brushSize}px`;if(b)b.textContent=`${brushSize}px`; }
    if (brush === 'opacity') { brushOpacity=Number(event.target.value)/100; const a=$('brushOpacityValue'),b=$('retouchOpacityValue');if(a)a.textContent=`${event.target.value}%`;if(b)b.textContent=`${event.target.value}%`; }
  }

  function hitTest(nx, ny) {
    for (let i = state.overlays.length - 1; i >= 0; i--) {
      const item = state.overlays[i]; if (item.visible === false) continue;
      const w = item.type === 'text' || item.type === 'sticker' ? Math.max(.12, String(item.text || '').length * (item.size || .09) * .58) : (item.w || .25);
      const h = item.type === 'text' || item.type === 'sticker' ? (item.size || .09) * Math.max(1, String(item.text || '').split('\n').length) * 1.35 : (item.h || .18);
      if (Math.abs(nx - item.x) <= w / 2 + .01 && Math.abs(ny - item.y) <= h / 2 + .01) return item;
    }
    return null;
  }

  function pointerToCanvas(event) {
    const rect = ui.canvas.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1), rect };
  }

  function onCanvasPointerDown(event) {
    if (!sourceBitmap || compareMode || ui.canvas.hidden) return;
    const point = pointerToCanvas(event);
    if(activeToolMode==='eyedropper'){
      try{const px=ctx.getImageData(Math.floor(point.x*ui.canvas.width),Math.floor(point.y*ui.canvas.height),1,1).data;const color='#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('');const before=snapshotState();state.backgroundKey.color=color;state.backgroundKey.enabled=true;pushHistory(before);updateHistoryButtons();renderPreview();renderPanel();markDirty();}catch(err){toast('Could not sample this image.');}
      activeToolMode='select';ui.canvas.classList.remove('interactive');$('toolHint').textContent='Select a tool to continue editing';return;
    }
    if(activeToolMode==='clone-sample'||activeToolMode==='heal-sample'){
      cloneSourcePoint={x:point.x,y:point.y};const healing=activeToolMode==='heal-sample';activeToolMode=healing?'heal':'clone';ui.canvas.classList.add('interactive');$('toolHint').textContent=healing?'Paint over a small blemish to heal it':'Paint over the area to retouch';renderPanel();toast(healing?'Healing source set. Paint over the imperfection.':'Clone source set. Paint over the area to cover.');return;
    }
    if(activeToolMode==='magic'){
      const before=snapshotState();state.selection={shape:'magic',x:point.x,y:point.y,w:0,h:0,tolerance:magicTolerance,contiguous:magicContiguous,feather:0,invert:false};
      const mask=buildSelectionMask(state.selection,ui.canvas.width,ui.canvas.height,0);mask.width=mask.height=1;
      if(!state.selection.bounds||state.selection.bounds.w<.002||state.selection.bounds.h<.002){state.selection=null;toast('No matching pixels found. Increase tolerance and try again.');}
      else{pushHistory(before);markDirty();toast(`Magic wand selected ${Math.round(state.selection.bounds.w*state.selection.bounds.h*100)}% of the image area.`);}
      activeToolMode='select';ui.canvas.classList.remove('interactive');drawSelectionPreview();renderPanel();return;
    }
    if (['select-rect','select-ellipse','select-lasso','select-linear','select-radial','select-brush'].includes(activeToolMode)) {
      const brushSelect=activeToolMode==='select-brush';
      const shape = brushSelect ? 'paint' : activeToolMode.replace('select-','');
      const before = snapshotState();
      const preview={ shape, x: point.x, y: point.y, w: 0, h: 0, start:{x:point.x,y:point.y}, end:{x:point.x,y:point.y}, points: shape==='lasso'?[{x:point.x,y:point.y}]:[], strokes:brushSelect?[{width:brushSize/Math.max(1,Math.min(ui.canvas.width,ui.canvas.height)),points:[point]}]:[], feather: state.selection?.feather||0, invert:false };
      pointerOperation = { type: brushSelect?'selection-brush':'selection', shape, startX: point.x, startY: point.y, before, preview };
      ui.canvas.setPointerCapture(event.pointerId); event.preventDefault(); drawSelectionPreview(); return;
    }
    if (activeToolMode === 'crop') {
      pointerOperation = { type: 'crop', startX: point.x, startY: point.y, before: snapshotState(), rect: point.rect };
      ui.cropOverlay.hidden = false;
      ui.cropSelection.classList.add('visible');
      updateCropSelection(point.x, point.y, point.x, point.y, point.rect);
      ui.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }
    if (activeToolMode === 'red-eye') {
      const before=snapshotState();state.strokes.push({id:uid(),mode:'red-eye',width:brushSize/Math.max(1,Math.min(ui.canvas.width,ui.canvas.height)),opacity:brushOpacity,points:[point]});commitChange(before);renderPanel();toast('Red-eye correction applied.');return;
    }
    if (activeToolMode === 'draw' || activeToolMode === 'erase' || activeToolMode === 'clone' || activeToolMode === 'heal' || activeToolMode === 'dodge' || activeToolMode === 'burn') {
      beginHistoryTransaction();
      const stroke = { id: uid(), mode: activeToolMode==='erase'?'erase':activeToolMode==='clone'?'clone':activeToolMode==='heal'?'heal':activeToolMode==='dodge'?'dodge':activeToolMode==='burn'?'burn':'draw', sample:(activeToolMode==='clone'||activeToolMode==='heal')?cloneSourcePoint:null, color: brushColor, width: brushSize / Math.max(1, Math.min(ui.canvas.width, ui.canvas.height)), opacity: brushOpacity, points: [point] };
      state.strokes.push(stroke);
      pointerOperation = { type: activeToolMode, stroke, before: pointerOperation.before };
      ui.canvas.setPointerCapture(event.pointerId);
      renderPreview(); event.preventDefault(); return;
    }
    const hit = hitTest(point.x, point.y);
    if (hit) {
      selectedOverlayId = hit.id;
      beginHistoryTransaction();
      pointerOperation = { type: 'move', id: hit.id, startX: point.x, startY: point.y, originalX: hit.x, originalY: hit.y, before: pointerOperation.before };
      renderPanel(); updateSelectionBox(); ui.canvas.setPointerCapture(event.pointerId); event.preventDefault();
    } else {
      selectedOverlayId = null; renderPreview(); renderPanel();
    }
  }

  function updateCropSelection(x1, y1, x2, y2, canvasRect) {
    const stageRect = ui.stage.getBoundingClientRect();
    const leftPx = canvasRect.left - stageRect.left + Math.min(x1, x2) * canvasRect.width;
    const topPx = canvasRect.top - stageRect.top + Math.min(y1, y2) * canvasRect.height;
    const widthPx = Math.abs(x2 - x1) * canvasRect.width;
    const heightPx = Math.abs(y2 - y1) * canvasRect.height;
    ui.cropSelection.style.left = `${leftPx}px`; ui.cropSelection.style.top = `${topPx}px`;
    ui.cropSelection.style.width = `${widthPx}px`; ui.cropSelection.style.height = `${heightPx}px`;
  }

  function onCanvasPointerMove(event) {
    if (!pointerOperation || !sourceBitmap) return;
    const point = pointerToCanvas(event);
    if (pointerOperation.type === 'selection' || pointerOperation.type === 'selection-brush') {
      const op = pointerOperation;
      if (op.shape === 'paint') {
        const stroke=op.preview.strokes[0],last=stroke.points[stroke.points.length-1];
        if(Math.hypot(point.x-last.x,point.y-last.y)>.0015)stroke.points.push({x:point.x,y:point.y});
      } else if (op.shape === 'lasso') {
        const last = op.preview.points[op.preview.points.length - 1];
        if (Math.hypot(point.x-last.x, point.y-last.y) > .003) op.preview.points.push({x:point.x,y:point.y});
        const xs=op.preview.points.map(p=>p.x), ys=op.preview.points.map(p=>p.y);
        op.preview.x=Math.min(...xs); op.preview.y=Math.min(...ys); op.preview.w=Math.max(...xs)-op.preview.x; op.preview.h=Math.max(...ys)-op.preview.y;
      } else if (op.shape === 'linear' || op.shape === 'radial') {
        op.preview.end={x:point.x,y:point.y};
        op.preview.x=Math.min(op.startX,point.x); op.preview.y=Math.min(op.startY,point.y);
        op.preview.w=Math.abs(point.x-op.startX); op.preview.h=Math.abs(point.y-op.startY);
      } else {
        op.preview.x=Math.min(op.startX,point.x); op.preview.y=Math.min(op.startY,point.y);
        op.preview.w=Math.abs(point.x-op.startX); op.preview.h=Math.abs(point.y-op.startY);
      }
      drawSelectionPreview();
    } else if (pointerOperation.type === 'crop') {
      updateCropSelection(pointerOperation.startX, pointerOperation.startY, point.x, point.y, pointerOperation.rect);
    } else if (pointerOperation.type === 'move') {
      const item = state.overlays.find(x => x.id === pointerOperation.id); if (!item) return;
      item.x = clamp(pointerOperation.originalX + point.x - pointerOperation.startX, 0, 1);
      item.y = clamp(pointerOperation.originalY + point.y - pointerOperation.startY, 0, 1);
      pointerOperation.changed = Math.abs(item.x - pointerOperation.originalX) > .0005 || Math.abs(item.y - pointerOperation.originalY) > .0005;
      renderPreview(); updateSelectionBox();
    } else if (pointerOperation.type === 'draw' || pointerOperation.type === 'erase' || pointerOperation.type === 'clone' || pointerOperation.type === 'heal' || pointerOperation.type === 'dodge' || pointerOperation.type === 'burn') {
      const points = pointerOperation.stroke.points;
      const last = points[points.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) > .001) {
        points.push({ x: point.x, y: point.y });
        pointerOperation.changed = true;
        renderPreview();
      }
    }
  }

  function onCanvasPointerUp(event) {
    if (!pointerOperation) return;
    if (pointerOperation.type === 'selection' || pointerOperation.type === 'selection-brush') {
      const op = pointerOperation;
      const preview = op.preview;
      const selectionIsValid = op.shape==='paint' ? !!preview.strokes?.[0]?.points?.length : (['linear','radial'].includes(op.shape) ? Math.hypot(preview.end.x-preview.start.x, preview.end.y-preview.start.y) > .02 : preview.w > .012 && preview.h > .012 && (op.shape !== 'lasso' || preview.points.length > 2));
      if (selectionIsValid) {
        const before = op.before; state.selection = clone(preview); pushHistory(before); markDirty();
        toast(`${op.shape==='paint'?'Brush':op.shape[0].toUpperCase()+op.shape.slice(1)} selection created.`);
      } else { drawSelectionPreview(); }
      activeToolMode='select'; ui.canvas.classList.remove('interactive'); $('toolHint').textContent='Selection ready. Create a local mask or keep editing.';
      renderPanel();
    } else if (pointerOperation.type === 'crop') {
      const op = pointerOperation; const point = pointerToCanvas(event);
      let left = Math.min(op.startX, point.x), top = Math.min(op.startY, point.y);
      let width = Math.abs(point.x - op.startX), height = Math.abs(point.y - op.startY);
      ui.cropSelection.classList.remove('visible'); ui.cropOverlay.hidden = true;
      if (width > .025 && height > .025) {
        const before = op.before;
        const old = state.crop;
        if (cropRatio !== 'free') {
          const dims = currentDimensions(); const target = cropRatio.split(':').map(Number).reduce((x,y)=>x/y);
          const selectionRatio = (width * dims.width) / (height * dims.height);
          if (selectionRatio > target) { const adjusted = height * dims.height * target / dims.width; left += (width - adjusted) / 2; width = adjusted; }
          else { const adjusted = width * dims.width / target / dims.height; top += (height - adjusted) / 2; height = adjusted; }
        }
        const nextCrop = { x: old.x + left * old.w, y: old.y + top * old.h, w: width * old.w, h: height * old.h };
        remapMasksForCrop(old, nextCrop);
        state.selection = null;
        state.crop = nextCrop;
        pushHistory(before); renderPreview(); markDirty(); toast('Crop applied.');
      }
      activeToolMode = 'select'; ui.canvas.classList.remove('interactive'); $('toolHint').textContent = 'Select a tool to continue editing';
    } else if (pointerOperation.type === 'move') {
      if (pointerOperation.changed) { pushHistory(pointerOperation.before); markDirty(); }
      renderPanel(); updateSelectionBox();
    } else if (pointerOperation.type === 'draw' || pointerOperation.type === 'erase' || pointerOperation.type === 'clone' || pointerOperation.type === 'heal' || pointerOperation.type === 'dodge' || pointerOperation.type === 'burn') {
      if (pointerOperation.changed) pushHistory(pointerOperation.before);
      markDirty();
    }
    pointerOperation = null;
  }

  function updateExportPreview() {
    const thumb = document.createElement('canvas');
    renderToCanvas(thumb, 180, true);
    $('exportThumb').innerHTML = '';
    const img = new Image(); img.src = thumb.toDataURL('image/jpeg', .75); $('exportThumb').appendChild(img);
    const d = currentDimensions(); const ow=Number($('exportWidth')?.value)||d.width, oh=Number($('exportHeight')?.value)||d.height; $('exportSizeText').textContent = `${ow.toLocaleString()} × ${oh.toLocaleString()} px · ${formatBytes(currentBlob?.size || 0)} source`;
    $('exportFileName').textContent = `${niceName($('exportName').value)}.${extensionFor($('exportFormat').value)}`;
  }
  function extensionFor(mime) { return mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'; }

  function openExport() {
    if (!sourceBitmap) { toast('Import an image before exporting.'); return; }
    const d=currentDimensions();
    $('exportName').value = niceName($('projectName').value).toLowerCase().replace(/\s+/g, '-');
    $('exportWidth').value=d.width; $('exportHeight').value=d.height;
    $('exportRatioLabel').textContent=`${(d.width/d.height).toFixed(3)} : 1 source ratio`;
    $('exportLockRatio').checked=true; $('exportSizePreset').value='original';
    updateExportPreview(); ui.exportModal.hidden = false;
  }

  async function chooseBatchFiles() {
    batchDirectoryHandle = null;
    if (window.showDirectoryPicker && window.isSecureContext) {
      try { batchDirectoryHandle = await window.showDirectoryPicker({mode:'readwrite'}); }
      catch(error) { if(error?.name==='AbortError') return; console.info('Folder access is unavailable; using regular downloads.',error); }
    }
    $('batchInput').click();
  }

  async function processBatchFiles(files) {
    if(!sourceBitmap||!files?.length)return;
    const valid=[...files].filter(file=>file.type.startsWith('image/') && file.size<=150*1024*1024);
    if(!valid.length){toast('Choose supported image files under 150 MB each.');return;}
    const original={sourceBitmap,currentBlob,sourceName,state,orientedCache,orientedCacheKey};
    const outputs=[];
    const format='image/jpeg',quality=.92;
    try{
      for(let index=0;index<valid.length;index++){
        const file=valid[index];
        setSaveStatus(`Batch ${index+1}/${valid.length}`,true);
        const bitmap=await decodeImageFile(file);
        sourceBitmap=bitmap;currentBlob=file;sourceName=file.name||'Photo';orientedCache=null;orientedCacheKey='';
        const look=makeDefaultState();
        look.adjustments={...original.state.adjustments};look.preset=original.state.preset||'custom';look.lut=original.state.lut?clone(original.state.lut):null;
        look.frame=clone(original.state.frame||look.frame);look.background=original.state.background||'transparent';look.backgroundKey=clone(original.state.backgroundKey||look.backgroundKey);
        state=look;
        const canvas=document.createElement('canvas');renderToCanvas(canvas,5000,true,format==='image/jpeg'?'#ffffff':null);
        const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('Batch image encode failed.')),format,quality));
        outputs.push({blob,name:`${niceName(file.name.replace(/\.[^.]+$/,''))}-edited.jpg`});
        canvas.width=canvas.height=1;bitmap.close?.();
      }
    }catch(error){console.error('Batch processing failed:',error);toast('Batch processing stopped. Some images may not have exported.');}
    finally{sourceBitmap=original.sourceBitmap;currentBlob=original.currentBlob;sourceName=original.sourceName;state=original.state;orientedCache=original.orientedCache;orientedCacheKey=original.orientedCacheKey;renderPreview();renderPanel();setSaveStatus(isDirty?'Unsaved changes':'All changes saved',isDirty);}
    if(batchDirectoryHandle){
      try{
        for(const output of outputs){const handle=await batchDirectoryHandle.getFileHandle(output.name,{create:true});const writable=await handle.createWritable();await writable.write(output.blob);await writable.close();}
        toast(`Saved ${outputs.length} edited photo(s) to the selected folder.`);
      }catch(error){console.error('Folder save failed:',error);toast('Folder save was unavailable. Downloading the images instead.');batchDirectoryHandle=null;}
    }
    if(!batchDirectoryHandle){
      for(let i=0;i<outputs.length;i++){
        const url=URL.createObjectURL(outputs[i].blob),a=document.createElement('a');a.href=url;a.download=outputs[i].name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
        await new Promise(resolve=>setTimeout(resolve,350));
      }
      toast(`Batch export complete: ${outputs.length} of ${valid.length} photo(s).`);
    }
    batchDirectoryHandle=null;
  }

  async function importCubeLut(file) {
    if(!file)return;
    try{
      const text=await file.text(),lut=parseCubeLut(text),before=snapshotState();
      state.lut=lut;commitChange(before);toast(`Loaded ${lut.title} · ${lut.sourceSize}³ LUT.`);
    }catch(error){console.error(error);toast(error.message||'Could not read this .cube LUT.');}
  }

  async function exportImage() {
    if (!sourceBitmap) return;
    const d=currentDimensions();
    let outW=Math.max(1,Math.round(Number($('exportWidth').value)||d.width));
    let outH=Math.max(1,Math.round(Number($('exportHeight').value)||d.height));
    if($('exportLockRatio').checked){ const ratio=d.width/d.height; if(document.activeElement===$('exportHeight'))outW=Math.round(outH*ratio); else outH=Math.round(outW/ratio); }
    const maxSide=12000, maxArea=window.matchMedia('(max-width: 780px)').matches?16000000:36000000;
    const scale=Math.min(1,maxSide/Math.max(outW,outH),Math.sqrt(maxArea/(outW*outH)));
    if(scale<1){outW=Math.max(1,Math.floor(outW*scale));outH=Math.max(1,Math.floor(outH*scale));toast(`Output scaled to ${outW} × ${outH} to protect device memory.`);}
    const sourceCanvas=document.createElement('canvas'), canvas=document.createElement('canvas');
    try {
      renderToCanvas(sourceCanvas, Math.max(outW,outH), true, $('exportFormat').value==='image/jpeg'?'#ffffff':null);
      canvas.width=outW; canvas.height=outH;
      const c=canvas.getContext('2d'); c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
      c.drawImage(sourceCanvas,0,0,outW,outH);
      const mime=$('exportFormat').value, quality=Number($('exportQuality').value)/100;
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('Browser could not encode this image.')),mime,quality));
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=`${niceName($('exportName').value||'mindiw-creation')}.${extensionFor(mime)}`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),15000);
      ui.exportModal.hidden=true; toast(`Exported ${outW} × ${outH} · ${extensionFor(mime).toUpperCase()} · ${formatBytes(blob.size)}`);
    } catch(error){ console.error(error); toast('Export failed. Try a smaller size or another format.'); }
    finally{sourceCanvas.width=sourceCanvas.height=1;canvas.width=canvas.height=1;}
  }

  function resetEverything() {
    if (!sourceBitmap) return;
    if (!confirm('Reset all edits and return to the original image?')) return;
    const before = snapshotState(); state = makeDefaultState(); selectedOverlayId = null; activeToolMode = 'select'; orientedCache = null;
    commitChange(before); updateHistoryButtons(); toast('All edits have been reset.');
  }

  function onGlobalClick(event) {
    const panelButton = event.target.closest('[data-panel]');
    if (panelButton && panelButton.dataset.panel) { showPanel(panelButton.dataset.panel); return; }
    const close = event.target.closest('[data-close]');
    if (close) { $(close.dataset.close).hidden = true; return; }
    const projectOpen = event.target.closest('[data-open-project]');
    if (projectOpen) { openProject(projectOpen.dataset.openProject); return; }
    const projectDelete = event.target.closest('[data-delete-project]');
    if (projectDelete) {
      const id = projectDelete.dataset.deleteProject;
      if (confirm('Delete this saved project from this device?')) dbDelete(id).then(renderProjects).then(() => toast('Project deleted.')).catch(() => toast('Could not delete project.'));
      return;
    }
  }

  function bindEvents() {
    $('startEditingButton').addEventListener('click', () => ui.file.click());
    $('importButton').addEventListener('click', () => ui.file.click());
    $('newProjectImportButton').addEventListener('click', () => ui.file.click());
    $('openProjectsButton').addEventListener('click', async () => { if (sourceBitmap) await saveProject(true); await showProjects(); });
    $('browseProjectsButton').addEventListener('click', showProjects);
    $('projectsBackButton').addEventListener('click', () => { ui.projects.hidden = true; ui.welcome.hidden = false; });
    $('backButton').addEventListener('click', async () => { await saveProject(true); ui.editor.hidden = true; ui.welcome.hidden = false; ui.editor.classList.remove('panel-open'); });
    $('backHomeButton')?.addEventListener('click', () => { ui.editor.hidden = true; ui.welcome.hidden = false; });
    $('saveProjectButton').addEventListener('click', () => saveProject(false));
    $('undoButton').addEventListener('click', undo);
    $('redoButton').addEventListener('click', redo);
    $('mobileUndoButton')?.addEventListener('click', undo);
    $('mobileRedoButton')?.addEventListener('click', redo);
    $('mobileResetButton')?.addEventListener('click', resetEverything);
    $('mobileSaveButton')?.addEventListener('click', () => saveProject(false));
    $('mobileExportButton')?.addEventListener('click', openExport);
    $('resetButton').addEventListener('click', resetEverything);
    $('exportButton').addEventListener('click', openExport);
    $('exportButtonTop').addEventListener('click', openExport);
    $('confirmExportButton').addEventListener('click', exportImage);
    $('exportFormat').addEventListener('change', () => { $('transparencyNote').textContent = $('exportFormat').value === 'image/jpeg' ? 'JPEG does not support transparency. Transparent areas will be filled with white.' : $('exportFormat').value === 'image/webp' ? 'WebP offers compact files with transparency support in modern browsers.' : 'PNG preserves transparent areas and keeps lossless quality.'; updateExportPreview(); });
    $('exportName').addEventListener('input', () => { $('exportFileName').textContent = `${niceName($('exportName').value)}.${extensionFor($('exportFormat').value)}`; });
    $('exportQuality').addEventListener('input', () => { $('qualityValue').textContent = `${$('exportQuality').value}%`; });
    const syncExportSize=(changed)=>{ if(!sourceBitmap)return; const d=currentDimensions(), ratio=d.width/d.height; let w=Math.max(1,Number($('exportWidth').value)||d.width), h=Math.max(1,Number($('exportHeight').value)||d.height); if($('exportLockRatio').checked){if(changed==='height')w=Math.round(h*ratio);else h=Math.round(w/ratio);} $('exportWidth').value=w; $('exportHeight').value=h; $('exportRatioLabel').textContent=`${(w/h).toFixed(3)} : 1 output ratio`; $('exportSizeText').textContent=`${w.toLocaleString()} × ${h.toLocaleString()} px · custom export`; };
    $('exportWidth').addEventListener('input',()=>syncExportSize('width'));
    $('exportHeight').addEventListener('input',()=>syncExportSize('height'));
    $('exportLockRatio').addEventListener('change',()=>syncExportSize('width'));
    $('exportSizePreset').addEventListener('change',()=>{if(!sourceBitmap)return;const d=currentDimensions(),v=$('exportSizePreset').value;let scale=1;if(v==='1080')scale=1080/Math.max(d.width,d.height);else if(v==='2048')scale=2048/Math.max(d.width,d.height);else if(v==='3000')scale=3000/Math.max(d.width,d.height);else if(v==='3840')scale=3840/Math.max(d.width,d.height);else if(v==='2x')scale=2;else if(v==='half')scale=.5;$('exportLockRatio').checked=true;$('exportWidth').value=Math.round(d.width*scale);$('exportHeight').value=Math.round(d.height*scale);syncExportSize('width');});
    $('aboutButton').addEventListener('click', () => { $('aboutModal').hidden = false; });
    $('mobilePanelClose').addEventListener('click', closeMobilePanel);
    ui.file.addEventListener('change', event => { const file = event.target.files?.[0]; if (file) loadImageFile(file, true); event.target.value = ''; });
    ui.replace.addEventListener('change', event => { const file = event.target.files?.[0]; if (file) loadImageFile(file, true); event.target.value = ''; });
    $('overlayFileInput').addEventListener('change', event => { const file=event.target.files?.[0]; if(file)addPhotoLayer(file); event.target.value=''; });
    $('lutInput')?.addEventListener('change', event => { const file=event.target.files?.[0]; if(file)importCubeLut(file); event.target.value=''; });
    $('batchInput')?.addEventListener('change', event => { const files=[...(event.target.files||[])]; if(files.length)processBatchFiles(files); event.target.value=''; });
    ui.panel.addEventListener('click', onPanelClick);
    ui.panel.addEventListener('input', onPanelInput);
    ui.panel.addEventListener('pointerdown', onCurvePointerDown);
    window.addEventListener('pointermove', event=>{if(curveDrag)updateCurvePoint(event);});
    window.addEventListener('pointerup', finishCurvePointer);
    window.addEventListener('pointercancel', finishCurvePointer);
    ui.panel.addEventListener('pointerdown', event => { if (event.target.matches('[data-adjust],[data-layer-range],[data-mask-range]')) beginHistoryTransaction(); });
    ui.panel.addEventListener('pointerup', event => { if (event.target.matches('[data-adjust],[data-layer-range],[data-mask-range]')) { finishHistoryTransaction(); markDirty(); } });
    ui.panel.addEventListener('focusin', event => { if (event.target.matches('[data-layer-field],[data-key-field],[data-frame-field],[data-background-color],[data-image-layer-field]')) panelFieldSnapshot = snapshotState(); });
    ui.panel.addEventListener('focusout', event => {
      if (event.target.matches('[data-layer-field],[data-key-field],[data-frame-field],[data-background-color],[data-image-layer-field]') && panelFieldSnapshot) {
        const before = panelFieldSnapshot; panelFieldSnapshot = null;
        if (JSON.stringify(before) !== JSON.stringify(state)) { pushHistory(before); updateHistoryButtons(); markDirty(); }
      }
    });
    ui.panel.addEventListener('change', event => { if(event.target.id==='curveChannel'){activeCurveChannel=event.target.value;drawCurveEditor();return;} if (event.target.matches('[data-layer-field],[data-key-field],[data-frame-field],[data-background-color],[data-image-layer-field]') && panelFieldSnapshot) { const before = panelFieldSnapshot; panelFieldSnapshot = null; if (JSON.stringify(before) !== JSON.stringify(state)) { pushHistory(before); updateHistoryButtons(); markDirty(); } } });
    document.addEventListener('click', onGlobalClick);
    ui.canvas.addEventListener('pointerdown', onCanvasPointerDown);
    ui.canvas.addEventListener('pointermove', onCanvasPointerMove);
    ui.canvas.addEventListener('pointerup', onCanvasPointerUp);
    ui.canvas.addEventListener('pointercancel', onCanvasPointerUp);
    ui.stage.addEventListener('dragover', event => { event.preventDefault(); ui.stage.classList.add('drag-over'); });
    ui.stage.addEventListener('dragleave', () => ui.stage.classList.remove('drag-over'));
    ui.stage.addEventListener('drop', event => { event.preventDefault(); ui.stage.classList.remove('drag-over'); const file = [...(event.dataTransfer?.files || [])].find(x => x.type.startsWith('image/')); if (file) loadImageFile(file, true); else toast('Drop an image file to open it.'); });
    $('fitButton').addEventListener('click', () => fitCanvas(true));
    $('zoomOutButton').addEventListener('click', () => { zoom = clamp(zoom - .15, .25, 3); fitCanvas(false); });
    $('zoomInButton').addEventListener('click', () => { zoom = clamp(zoom + .15, .25, 3); fitCanvas(false); });
    $('fullscreenButton').addEventListener('click', async () => { try { if (!document.fullscreenElement) await $('canvasWorkspace').requestFullscreen(); else await document.exitFullscreen(); } catch { toast('Fullscreen is not available in this browser.'); } });
    $('toggleGridButton').addEventListener('click', () => { isGridOn = !isGridOn; ui.stage.classList.toggle('grid-off', !isGridOn); });
    $('compareButton').addEventListener('pointerdown', () => { if (!sourceBitmap) return; compareMode = true; renderPreview(); $('compareButton').classList.add('selected'); });
    ['pointerup','pointerleave','pointercancel'].forEach(name => $('compareButton').addEventListener(name, () => { if (compareMode) { compareMode = false; renderPreview(); $('compareButton').classList.remove('selected'); } }));
    $('projectName').addEventListener('change', () => { if (sourceBitmap) { markDirty(); saveProject(true); } });
    $('installButton').addEventListener('click', installApp);
    $('canvasWorkspace').addEventListener('dragover', event => event.preventDefault());
    window.addEventListener('resize', () => fitCanvas(false));
    document.addEventListener('keydown', onKeyboard);
    window.addEventListener('beforeunload', () => { if (isDirty && sourceBitmap) saveProject(true); });
  }

  function onKeyboard(event) {
    if (event.target.matches('input,textarea,select,[contenteditable=true]')) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
    else if (mod && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) { event.preventDefault(); redo(); }
    else if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); saveProject(false); }
    else if (mod && event.key.toLowerCase() === 'o') { event.preventDefault(); ui.file.click(); }
    else if (event.key === 'Delete' || event.key === 'Backspace') { if (selectedOverlayId) { event.preventDefault(); deleteSelected(); } }
    else if (event.key === 'Escape') { closeMobilePanel(); ui.exportModal.hidden = true; $('aboutModal').hidden = true; }
    else if (event.key.toLowerCase()==='b' && !mod) { showPanel('retouch'); }
    else if (event.key.toLowerCase()==='m' && !mod) { showPanel('select'); startSelectionTool('rect'); }
    else if (event.key.toLowerCase()==='l' && !mod) { showPanel('select'); startSelectionTool('lasso'); }
    else if (event.key.toLowerCase()==='w' && !mod) { showPanel('select'); activeToolMode='magic';ui.canvas.classList.add('interactive');$('toolHint').textContent='Click a colour area to select connected pixels';closeMobilePanel(); }
  }

  function isAppleMobile() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  }

  function setupInstallability() {
    // No automatic install prompt and no custom install dialog. Users install manually
    // from the browser menu (or install the native desktop release on desktop platforms).
    $('installButton').hidden = true;
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = null;
    });
    window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; });
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed:', error)));
    }
  }

  async function installApp() {
    // Intentionally no custom popup, alert, or automatic browser prompt.
    // PWA installation is available from the browser's own menu.
    $('installButton').hidden = true;
  }

  function init() {
    bindEvents(); setupInstallability(); updateHistoryButtons();
    $('exportButtonTop').disabled = true;
    $('exportButton').disabled = true;
    ui.welcome.hidden = false; ui.editor.hidden = true; ui.projects.hidden = true;
    window.addEventListener('load', () => {
      if (window.location.hash === '#projects') showProjects();
      else if (window.location.hash === '#new') ui.file.click();
    });
  }

  init();
})();
