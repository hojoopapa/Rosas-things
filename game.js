// Rosa's Shot - 세로 스크롤 슈팅 (15개 맵)
// 갤러그식 편대 입장/급강하 + 라이덴식 자동 연사 + 보스 탄막
// 테스트용 주소 인자: ?stage=N 시작 맵, ?boss=1 보스 바로, ?god=1 무적, ?pad=1~2 조작 방식 강제(1 밀기, 2 조이스틱), ?char=dog|cat 캐릭터, ?w=bullet|laser|missile&lv=1~4 무기
const W = 480, H = 1040; // 갤럭시 S24 울트라(1440x3120, 19.5:9)에 맞춘 세로로 긴 화면
const MY = (H - 800) / 2; // 예전 800 높이 기준 화면 가운데 문구의 아래쪽 보정
const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "Yu Gothic", "Hiragino Sans", "Microsoft YaHei", "PingFang SC", sans-serif';
const QB = Phaser.Math.Interpolation.QuadraticBezier;
const PARAMS = new URLSearchParams(location.search);
const MAX_STAGE = 15;
// 조작 방식 2가지 (타이틀에서 선택, 저장됨): 1 밀기(좌우), 2 조이스틱(전후좌우)
let PAD = (() => {
	if (PARAMS.has('pad')) return Number(PARAMS.get('pad')) === 2 ? 2 : 1;
	try { if (localStorage.getItem('rs_ctl') === '2') return 2; } catch (e) { /* 무시 */ }
	return 1;
})();
let PAD_Y, PLAYER_Y; // 패드 윗선, 밀기 모드의 기체 높이
function applyPad() { PAD_Y = PAD === 2 ? H - 260 : H - 110; PLAYER_Y = H - 200; }
const JOY_POS = { x: 96, y: H - 112 }; // 조이스틱 모드: 왼쪽 아래 고정 조이스틱, 오른쪽에 버튼 2개
applyPad();
function setPad(v) {
	PAD = v;
	applyPad();
	try { localStorage.setItem('rs_ctl', String(v)); } catch (e) { /* 무시 */ }
}
// 캐릭터 2종: dog 말티푸, cat 샴고양이 (타이틀에서 선택, 저장됨)
let CHAR = (() => {
	if (PARAMS.has('char')) return PARAMS.get('char') === 'cat' ? 'cat' : 'dog';
	try { if (localStorage.getItem('rs_char') === 'cat') return 'cat'; } catch (e) { /* 무시 */ }
	return 'dog';
})();
function setChar(v) { CHAR = v; try { localStorage.setItem('rs_char', v); } catch (e) { /* 무시 */ } }
// 무기(떨어지는 꽃): 노란 국화=총알, 분홍 벚꽃=레이저, 빨간 꽃=유도탄. 같은 꽃을 먹으면 레벨업(최대 4), 다른 꽃을 먹으면 종류가 바뀌며 한 단계 내려간다
const WEAPONS = ['bullet', 'laser', 'missile'];
const W_MAX = 4;
const JOY_R = 56, JOY_SPEED = 330; // 조이스틱 반지름, 기체 최고 속도(px/초)

// 난이도: hp=하트 수, bs=적 탄속 배율, fire=적 발사 간격 배율, boss=보스 체력, bomb/shield=시작 개수
// 2026-11-16 전체 30% 상향: 발사·급강하 빈도 x1.3, 보스 체력 x1.3, 탄속 x1.15 (탄속은 30%를 다 올리면 피할 수 없어 절반 수준)
const HARD_K = 1.3;
const DIFF = {
	easy:   { hp: 5, bs: 0.75 * 1.15, fire: 1.6 / HARD_K, boss: Math.round(40 * HARD_K), bomb: 3, shield: 1 },
	normal: { hp: 3, bs: 1.0 * 1.15,  fire: 1.0 / HARD_K, boss: Math.round(60 * HARD_K), bomb: 2, shield: 1 },
	hard:   { hp: 3, bs: 1.25 * 1.15, fire: 0.7 / HARD_K, boss: Math.round(80 * HARD_K), bomb: 2, shield: 1 }
};
// 맵 배경 색 (3맵마다 바뀜)
const SKY_TINT = [0xffffff, 0xfff0d0, 0xdcffe8, 0xeadcff, 0xffdce8];
// 떨어지는 아이템 종류 -> 꽃 그림
const ITEM_TEX = { bullet: 'chrys', laser: 'sakura', missile: 'redflower', bomb: 'bomb', shield: 'umbrella', heart: 'heartItem' };
const ITEM_COL = { bullet: 0xffd43b, laser: 0xff9fb5, missile: 0xff4d6a, bomb: 0xb88ad6, shield: 0x9fd8ff, heart: 0xff4d6d };

// ---------- 도트 스프라이트 정의 ----------
const PAL = {
	o: '#7a4b6b', w: '#fff6f2', k: '#4a3050', p: '#ff9fb5', b: '#9fd8ff',
	g: '#a8ecc8', c: '#fff3b0', r: '#ff6b81', y: '#ffe066', s: '#d9c7ff', x: '#c9c3cc', f: '#ff9a3c'
};
const SPR = {
	finger: { px: 4, rows: [
		'....oo......',
		'...owwo.....',
		'...owwo.....',
		'...owwo.....',
		'...owwooo...',
		'...owwowwoo.',
		'oo.owwowwowo',
		'owooowwwwwwo',
		'.owwwwwwwwwo',
		'.owwwwwwwwwo',
		'..owwwwwwwo.',
		'..owwwwwwwo.',
		'...owwwwwo..',
		'...ooooooo..'] },
	jelly: { px: 4, rows: [
		'...oooo...',
		'..oggggo..',
		'.oggggggo.',
		'.ogkggkgo.',
		'.oggggggo.',
		'.opggggpo.',
		'.oggggggo.',
		'.og.og.og.'] },
	macaron: { px: 4, rows: [
		'..oooooo..',
		'.oppppppo.',
		'oppkppkppo',
		'occcccccco',
		'.oppppppo.',
		'..oooooo..'] },
	boss: { px: 5, rows: [
		'.........oo.........',
		'........orro........',
		'.........oo.........',
		'...oooooooooooooo...',
		'..owwwwwwwwwwwwwwo..',
		'.owwwwwwwwwwwwwwwwo.',
		'.owwkkwwwwwwwwkkwwo.',
		'.owwkkwwwwwwwwkkwwo.',
		'.opwwwwwwkkwwwwwwpo.',
		'.owwwwwwwwwwwwwwwwo.',
		'..oppppppppppppppo..',
		'.oppppppppppppppppo.',
		'.occcccccccccccccco.',
		'.oppppppppppppppppo.',
		'..oooooooooooooooo..'] },
	// 내 총알: 눈에서 나가는 레이저. fine=true 는 1칸=1px 로 그대로 그리는 그림 (모양 2종을 섞어 일렁이게)
	pbullet: { fine: true, pal: { a: '#ff3d6b', b: '#ff9fb5', c: '#ffffff' }, rows: [
		'.....a.....',
		'....aba....',
		'...abcba...',
		'...abcba...',
		'..aabcbaa..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'...abcba...',
		'...abcba...',
		'....bcb....',
		'....bcb....',
		'.....b.....',
		'.....b.....',
		'.....b.....'] },
	pbullet2: { fine: true, pal: { a: '#ff3d6b', b: '#ff9fb5', c: '#ffffff' }, rows: [
		'.....a.....',
		'....aba....',
		'...abcba...',
		'...abcba...',
		'..aabcbaa..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'..abbcbba..',
		'...abcba...',
		'...abcba...',
		'....bcb....',
		'.....c.....',
		'.....b.....'] },
	heart: { px: 4, rows: ['.oo.oo.', 'orrorro', 'orrrrro', '.orrro.', '..oro..', '...o...'] },
	star: { px: 4, rows: ['..o..', '.oyo.', 'oyyyo', '.oyo.', 'o.o.o'] },
	spark: { px: 3, rows: ['.y.', 'yyy', '.y.'] }
};
// 색 바꾼 변형 (젤리 3색, 빈 하트)
const VARIANTS = {
	jelly2: ['jelly', { g: '#fff0a0' }],
	jelly3: ['jelly', { g: '#d9c7ff' }],
	heart_e: ['heart', { r: '#e6dde4' }]
};

// ---------- 도트 정밀화 ----------
// 원본 그림(1칸=px)을 4배 세밀한 격자(1칸=px/4)로 키운다. 모서리는 EPX 로 매끈하게 두 번 보정하고,
// 굵은 윤곽선은 바깥 1칸만 남겨 얇게 만든 뒤, 가장자리에 밝은/어두운 띠를 넣어 입체감을 준다.
const FINE = 4;
function epx(g) {
	const h = g.length, w = g[0].length, out = [];
	const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? '.' : g[y][x];
	for (let y = 0; y < h; y++) {
		const r0 = [], r1 = [];
		for (let x = 0; x < w; x++) {
			const P = g[y][x], A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
			let p1 = P, p2 = P, p3 = P, p4 = P;
			if (C === A && C !== D && A !== B) p1 = A;
			if (A === B && A !== C && B !== D) p2 = B;
			if (D === C && D !== B && C !== A) p3 = C;
			if (B === D && B !== A && D !== C) p4 = D;
			r0.push(p1, p2); r1.push(p3, p4);
		}
		out.push(r0, r1);
	}
	return out;
}
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2css = c => 'rgb(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ')';

function makeTex(scene, key, rows, px, pal, fine) {
	if (scene.textures.exists(key)) return;
	if (fine) { // 이미 최종 크기: 1칸=1px
		const c = scene.textures.createCanvas(key, rows[0].length, rows.length), ctx = c.getContext('2d');
		rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { ctx.fillStyle = pal[ch]; ctx.fillRect(x, y, 1, 1); } }));
		c.refresh();
		return;
	}
	const g = epx(epx(rows.map(r => [...r]))), GH = g.length, GW = g[0].length;
	const empty = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH || g[y][x] === '.';
	// 1. 윤곽선 정리: 바깥에 닿은 칸만 윤곽선으로 두고, 안쪽의 굵은 윤곽선은 주변 색으로 메운다
	const fix = g.map(r => r.slice());
	for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
		if (g[y][x] !== 'o' || empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1)) continue;
		const cnt = {};
		for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
			const ch = empty(x + dx, y + dy) ? '.' : g[y + dy][x + dx];
			if (ch !== '.' && ch !== 'o') cnt[ch] = (cnt[ch] || 0) + 1;
		}
		const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
		if (best) fix[y][x] = best;
	}
	const isLine = (x, y) => empty(x, y) || fix[y][x] === 'o';
	const OUT = hex2rgb(pal.o);
	// 2. 칸마다 색을 정해 그린다
	const s = px / FINE, tw = Math.ceil(GW * s), th = Math.ceil(GH * s);
	const c = scene.textures.createCanvas(key, tw, th), ctx = c.getContext('2d');
	for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
		const ch = fix[y][x];
		if (ch === '.') continue;
		let col;
		if (ch === 'o') { // 윤곽선: 붙어 있는 몸 색을 어둡게 섞어 부드럽게
			let near = null;
			for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++)
				if (!empty(x + dx, y + dy) && fix[y + dy][x + dx] !== 'o') near = hex2rgb(pal[fix[y + dy][x + dx]]);
			col = near ? near.map((v, i) => v * 0.35 + OUT[i] * 0.65) : OUT;
		} else {
			col = hex2rgb(pal[ch]);
			if (ch !== 'k') {
				const hi = isLine(x - 1, y - 1) || isLine(x - 1, y) || isLine(x, y - 1) || isLine(x - 2, y - 2);
				const lo = isLine(x + 1, y + 1) || isLine(x + 1, y) || isLine(x, y + 1) || isLine(x + 2, y + 2);
				if (hi && !lo) col = col.map(v => v + (255 - v) * 0.35);
				else if (lo && !hi) col = col.map((v, i) => v * 0.8 + OUT[i] * 0.12);
			}
		}
		ctx.fillStyle = rgb2css(col);
		const x0 = Math.round(x * s), y0 = Math.round(y * s);
		ctx.fillRect(x0, y0, Math.max(1, Math.round((x + 1) * s) - x0), Math.max(1, Math.round((y + 1) * s) - y0));
	}
	c.refresh();
}

// 작게 줄인 복사본(타이틀 미리보기용): 도트 그림을 부드럽게 줄여 새 텍스처로
function makeSmall(scene, src, key, k) {
	if (scene.textures.exists(key)) return;
	const img = scene.textures.get(src).getSourceImage(), w = Math.round(img.width * k), h = Math.round(img.height * k);
	const c = scene.textures.createCanvas(key, w, h), ctx = c.getContext('2d');
	ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(img, 0, 0, w, h);
	c.refresh();
}

function makeBg(scene) {
	// 하늘 그라데이션 (고정)
	const c = scene.textures.createCanvas('sky', W, H), ctx = c.getContext('2d');
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, '#bfe8ff');
	g.addColorStop(1, '#ffdff0');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
	c.refresh();
	makeClouds(scene);
}

function txt(scene, x, y, s, size, color, extra) {
	return scene.add.text(x, y, s, Object.assign({
		fontFamily: FONT, fontSize: size + 'px', color: color || '#7a4b6b', fontStyle: 'bold',
		stroke: '#ffffff', strokeThickness: 5
	}, extra || {})).setOrigin(0.5);
}

function button(scene, x, y, w, h, label, color, cb) {
	const r = scene.add.rectangle(x, y, w, h, color).setStrokeStyle(4, 0x7a4b6b).setInteractive({ useHandCursor: true });
	const t = txt(scene, x, y, label, 28, '#7a4b6b');
	r.on('pointerover', () => r.setScale(1.04)).on('pointerout', () => r.setScale(1));
	r.on('pointerdown', () => { SFX.click(); cb(); });
	return [r, t];
}

function hiScore(v) {
	try {
		if (v === undefined) return +(localStorage.getItem('rs_hi') || 0);
		if (v > hiScore()) localStorage.setItem('rs_hi', v);
	} catch (e) { /* 저장 불가 환경은 무시 */ }
	return 0;
}

// ---------- 효과음: WebAudio 합성 (파일 없음, 사인/삼각파 위주로 말랑하게) ----------
const SFX = (() => {
	let ctx = null, master = null, muted = false;
	try { muted = localStorage.getItem('rt_mute') === '1'; } catch (e) { /* 무시 */ }

	// 브라우저는 사용자 동작 안에서만 소리를 허용하므로 첫 입력 때 켠다
	function init() {
		if (!ctx) {
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return false;
			ctx = new AC();
			master = ctx.createGain();
			master.gain.value = 0.5;
			master.connect(ctx.destination);
		}
		if (ctx.state === 'suspended') ctx.resume();
		return true;
	}
	// 음 하나: freq에서 시작해 slide 배로 미끄러지며 사라진다
	function tone(freq, dur, o) {
		if (muted || !init()) return;
		o = o || {};
		const t = ctx.currentTime + (o.delay || 0);
		const osc = ctx.createOscillator(), g = ctx.createGain();
		osc.type = o.type || 'sine';
		osc.frequency.setValueAtTime(freq, t);
		if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * o.slide), t + dur);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + 0.012);
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		osc.connect(g); g.connect(master);
		osc.start(t); osc.stop(t + dur + 0.03);
	}
	// 음 여러 개를 차례로 (짧은 멜로디)
	function notes(list, step, dur, o) {
		list.forEach((f, i) => tone(f, dur, Object.assign({}, o, { delay: ((o && o.delay) || 0) + i * step })));
	}
	// 반짝이는 바람소리 (폭탄용)
	function sweep(dur, vol) {
		if (muted || !init()) return;
		const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
		for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
		src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
		f.frequency.setValueAtTime(600, ctx.currentTime);
		f.frequency.exponentialRampToValueAtTime(5000, ctx.currentTime + dur);
		g.gain.setValueAtTime(vol, ctx.currentTime);
		g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
		src.connect(f); f.connect(g); g.connect(master);
		src.start();
	}
	return {
		init,
		get muted() { return muted; },
		toggle() {
			muted = !muted;
			try { localStorage.setItem('rt_mute', muted ? '1' : '0'); } catch (e) { /* 무시 */ }
			if (!muted) tone(880, 0.1, { type: 'triangle', vol: 0.15 });
		},
		shoot: () => tone(900 + Math.random() * 120, 0.06, { type: 'triangle', vol: 0.05, slide: 1.4 }), // 뾰옹
		tick: () => tone(700, 0.04, { vol: 0.07 }),                                                      // 콕
		pop: big => {                                                                                    // 뽕! (적 처치)
			tone(480, 0.13, { vol: 0.2, slide: 2.4 });
			tone(1100, 0.1, { type: 'triangle', vol: 0.1, slide: 0.5, delay: 0.04 });
			if (big) { notes([523, 659, 784, 1047], 0.09, 0.2, { type: 'triangle', vol: 0.18, delay: 0.1 }); }
		},
		hurt: () => {                                                                                    // 뿌잉 (피격)
			tone(560, 0.32, { type: 'triangle', vol: 0.25, slide: 0.4 });
			tone(280, 0.32, { vol: 0.15, slide: 0.5 });
		},
		item: kind => {                                                                                  // 띠리링 (아이템)
			if (kind === 'heart') notes([659, 880, 1047], 0.07, 0.14, { type: 'triangle', vol: 0.2 });
			else if (kind === 'bomb') notes([392, 523, 392, 659], 0.07, 0.14, { type: 'triangle', vol: 0.2 });
			else if (kind === 'shield') notes([523, 784, 1047, 1568], 0.06, 0.16, { type: 'sine', vol: 0.2 });
			else notes([784, 988, 1319], 0.06, 0.12, { type: 'triangle', vol: 0.2 });
		},
		bomb: () => {                                                                                    // 반짝반짝 쾅
			notes([523, 659, 784, 1047, 1319, 1568], 0.045, 0.18, { vol: 0.2 });
			tone(150, 0.4, { vol: 0.28, slide: 0.4, delay: 0.1 });
			sweep(0.55, 0.18);
		},
		shield: () => {                                                                                  // 포근한 달빛 (방패 켜기)
			notes([392, 523, 659, 784], 0.07, 0.3, { vol: 0.14 });
			tone(196, 0.5, { type: 'triangle', vol: 0.12, delay: 0.05 });
		},
		empty: () => tone(220, 0.1, { type: 'triangle', vol: 0.12, slide: 0.7 }),                       // 폭탄 없음
		wave: () => notes([880, 1175], 0.09, 0.12, { type: 'triangle', vol: 0.12 }),
		bossIn: () => notes([392, 330, 262], 0.16, 0.25, { type: 'triangle', vol: 0.22 }),
		clear: () => notes([523, 659, 784, 1047, 784, 1047, 1319], 0.12, 0.22, { type: 'triangle', vol: 0.22 }),
		over: () => notes([523, 440, 349, 262], 0.18, 0.3, { vol: 0.2, slide: 0.9 }),
		click: () => notes([660, 880], 0.05, 0.08, { type: 'triangle', vol: 0.15 })
	};
})();
['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, () => SFX.init(), { passive: true }));

// 소리 켜기/끄기 버튼 (♪)
function soundBtn(scene, x, y) {
	const t = txt(scene, x, y, '♪', 30).setInteractive({ useHandCursor: true });
	t.on('pointerdown', () => SFX.toggle());
	const f = () => t.setAlpha(SFX.muted ? 0.3 : 1);
	scene.events.on('update', f);
	scene.events.once('shutdown', () => scene.events.off('update', f));
	return t;
}

// ---------- 부팅: 텍스처 생성 ----------
class Boot extends Phaser.Scene {
	constructor() { super('Boot'); }
	create() {
		// sprites.js 의 새 그림(말티푸, 꽃, 보스)을 합친다. 같은 이름이면 새 그림이 덮어쓴다
		Object.assign(PAL, EXTRA_PAL);
		Object.assign(SPR, EXTRA_SPR);
		Object.assign(VARIANTS, EXTRA_VAR);
		Object.entries(SPR).forEach(([k, s]) => makeTex(this, k, s.rows, s.px, Object.assign({}, PAL, s.pal), s.fine));
		Object.entries(VARIANTS).forEach(([k, [base, pal]]) =>
			makeTex(this, k, SPR[base].rows, SPR[base].px, Object.assign({}, PAL, SPR[base].pal, pal)));
		makeBg(this);
		[['dog', drawDog], ['cat', drawCat]].forEach(([k, fn]) => {   // 영웅 2종: 인게임 / 입 벌림(폭탄) / 타이틀용 2배 해상도
			makeCharTex(this, k, 1, false, fn); makeCharTex(this, k + '_o', 1, true, fn); makeCharTex(this, k + '_big', 2, false, fn);
		});
		makeCapeShield(this); makeCapeIcon(this); makeEyeFlash(this); makeBomb(this); makeFlowers(this); makeShock(this);
		makeEnemyBullet(this); makeWeaponShots(this); makeItems(this);
		['sb0', 'sb1_1', 'mb0', 'mb1', 'ub0'].forEach(k => makeSmall(this, k, k + '_s', 0.6)); // 타이틀 보스 미리보기
		this.scene.start('Title');
	}
}

// ---------- 타이틀 ----------
class Title extends Phaser.Scene {
	constructor() { super('Title'); }
	create() {
		this.add.image(0, 0, 'sky').setOrigin(0);
		this.clouds = this.add.tileSprite(0, 0, W, H, 'clouds').setOrigin(0);
		txt(this, W / 2, 105, "Rosa's", 60, '#ff6b81');
		txt(this, W / 2, 168, 'Shot', 60, '#7a4b6b');
		// 영웅 고르기: 말티푸 / 샴고양이
		txt(this, W / 2, 232, tr('pick'), 18, '#9a7a8f');
		this.cards = {};
		['dog', 'cat'].forEach((k, i) => {
			const x = 140 + i * 200, y = 340;
			const card = this.add.rectangle(x, y, 176, 190, 0xffffff, 0.6).setStrokeStyle(4, 0xc9a3bd).setInteractive({ useHandCursor: true });
			const im = this.add.image(x, y - 14, k + '_big');
			const nm = txt(this, x, y + 74, tr(k), 22);
			card.on('pointerdown', () => { SFX.click(); setChar(k); this.refreshChar(); });
			this.tweens.add({ targets: im, y: y - 24, duration: 900 + i * 140, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
			this.cards[k] = { card, im, nm };
		});
		this.refreshChar();
		// 꽃 무기 안내: 노란 국화=총알, 분홍 벚꽃=레이저, 빨간 꽃=유도탄
		[['chrys', 'wbul'], ['sakura', 'wlas'], ['redflower', 'wmis']].forEach(([k, n], i) => {
			this.add.image(90 + i * 150, 478, k).setScale(0.62);
			txt(this, 90 + i * 150, 512, tr(n), 17, '#7a4b6b');
		});
		txt(this, W / 2, 544, tr('wnote'), 14, '#9a7a8f');
		// 만날 보스 미리보기: 곤충(소) - 바다 생물(중) - UFO(최종)
		['sb0', 'sb1_1', 'mb0', 'mb1', 'ub0'].forEach((k, i) => {
			const e = this.add.image(60 + i * 90, 600, k + '_s');
			this.tweens.add({ targets: e, y: 610, duration: 700 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		});
		button(this, W / 2, 690, 260, 60, tr('easy'), 0xbff0d4, () => this.start('easy'));
		button(this, W / 2, 760, 260, 60, tr('normal'), 0xfff3b0, () => this.start('normal'));
		button(this, W / 2, 830, 260, 60, tr('hard'), 0xffc2d4, () => this.start('hard'));

		// 조작 방식 선택 (◀ ▶ 로 밀기/조이스틱 중 고르기, 저장됨)
		txt(this, W / 2, 882, tr('control'), 16, '#9a7a8f');
		this.padLabel = txt(this, W / 2, 912, '', 24, '#7a4b6b');
		this.arrow(70, 912, -1);
		this.arrow(W - 70, 912, 1);
		this.refreshPad();

		// 언어 선택
		this.langLabel = txt(this, W / 2, 966, LANG_NAMES[LANG], 24, '#7a4b6b');
		this.arrow(70, 966, -1, true);
		this.arrow(W - 70, 966, 1, true);

		txt(this, W / 2, 1008, tr('best') + ' ' + hiScore(), 16, '#7a4b6b');
		soundBtn(this, W - 30, 30);

		// HOREETEC 홈으로 (허브 사이트에 없는 언어는 영어 페이지로). itch.io 같은 iframe 안에서는 숨긴다
		if (window.top === window.self) {
			const home = txt(this, 80, 30, '← HOREETEC', 18).setInteractive({ useHandCursor: true });
			home.on('pointerdown', () => {
				location.href = 'https://horeetec.com/' + (LANG === 'ko' ? '' : (['en', 'ja', 'zh', 'es'].includes(LANG) ? LANG : 'en') + '/');
			});
		}
	}
	refreshChar() {
		Object.entries(this.cards).forEach(([k, o]) => {
			const on = k === CHAR;
			o.card.setStrokeStyle(on ? 7 : 3, on ? 0xff6b81 : 0xc9a3bd).setFillStyle(on ? 0xfff0f6 : 0xffffff, on ? 0.9 : 0.5);
			o.im.setScale(on ? 1.06 : 0.9).setAlpha(on ? 1 : 0.75);
			o.nm.setColor(on ? '#ff6b81' : '#7a4b6b');
		});
	}
	start(level) {
		this.scene.start('Game', { level, stage: Number(PARAMS.get('stage')) || 1 });
	}
	// 좌우 화살표 버튼. lang=true 면 언어, 아니면 조작 방식을 바꾼다
	arrow(x, y, dir, lang) {
		const r = this.add.rectangle(x, y, 56, 40, 0xffe3f0).setStrokeStyle(3, 0x7a4b6b).setInteractive({ useHandCursor: true });
		txt(this, x, y, dir < 0 ? '◀' : '▶', 20);
		r.on('pointerdown', () => {
			SFX.click();
			if (lang) {
				setLang(LANGS[(LANGS.indexOf(LANG) + dir + LANGS.length) % LANGS.length]);
				this.scene.restart();
			} else {
				setPad(PAD === 1 ? 2 : 1);
				this.refreshPad();
			}
		});
	}
	refreshPad() {
		this.padLabel.setText(PAD + '/2  ' + tr('pad')[PAD]);
	}
	update() { this.clouds.tilePositionY -= 0.5; }
}

// ---------- 게임 ----------
class Game extends Phaser.Scene {
	constructor() { super('Game'); }
	// d.carry: 이전 맵에서 이어받는 점수/체력/강화/폭탄/방패
	init(d) {
		this.level = d.level || 'normal'; this.df = DIFF[this.level];
		this.stage = Math.min(MAX_STAGE, Math.max(1, d.stage || 1));
		this.carry = d.carry || null;
	}

	create() {
		this.add.image(0, 0, 'sky').setOrigin(0).setTint(SKY_TINT[Math.floor((this.stage - 1) / 3) % SKY_TINT.length]);
		this.cl1 = this.add.tileSprite(0, 0, W, H, 'clouds').setOrigin(0).setAlpha(0.5);
		this.cl2 = this.add.tileSprite(0, 0, W, H, 'clouds').setOrigin(0);
		this.cl2.tilePositionX = 200;

		const c = this.carry || {};
		this.score = c.score || 0; this.hp = c.hp || this.df.hp; this.invuln = 0;
		const pw = PARAMS.get('w');
		this.wtype = c.wtype || (WEAPONS.includes(pw) ? pw : 'bullet');
		this.wlevel = c.wlevel || Math.min(W_MAX, Math.max(1, Number(PARAMS.get('lv')) || 1));
		this.fireTick = 0;
		this.bombs = c.bombs !== undefined ? c.bombs : this.df.bomb; this.bombCd = 0;
		this.shields = c.shields !== undefined ? c.shields : this.df.shield; this.shieldUntil = 0; this.shieldTotal = 0;
		this.over = false; this.boss = null; this.bossCalled = false; this.wavesSpawned = 0;
		this.god = PARAMS.has('god');
		this.bossQueue = this.makeBossQueue(this.stage);
		this.totalWaves = this.stage <= 3 ? 2 : 3;

		this.pBul = this.physics.add.group();
		this.eBul = this.physics.add.group();
		this.enemies = this.physics.add.group();
		this.items = this.physics.add.group();

		// 플레이어: 판정은 중앙 작은 원(반지름 5)만
		this.player = this.physics.add.image(W / 2, PLAYER_Y, CHAR).setDepth(5);
		this.eyeSide = 0; // 한 발씩 번갈아 나가는 눈 (0 왼쪽, 1 오른쪽)
		this.player.setCircle(5, this.player.width / 2 - 5, this.player.height / 2 - 5);

		// UI
		this.hearts = [];
		for (let i = 0; i < this.df.hp; i++) this.hearts.push(this.add.image(24 + i * 32, 28, 'heart').setDepth(20));
		this.scoreTxt = txt(this, W - 16, 28, '0', 28).setOrigin(1, 0.5).setDepth(20);
		this.wIcon = this.add.image(30, 86, 'chrys').setScale(0.5).setDepth(20);
		this.powTxt = txt(this, 54, 86, '', 18).setOrigin(0, 0.5).setDepth(20);
		this.bossBar = this.add.graphics().setDepth(20);
		this.stageTxt = txt(this, W / 2, 28, this.stage + '/' + MAX_STAGE, 20).setDepth(20);
		// 폭탄(입에서 뱉는 장미 폭탄) 버튼은 오른쪽 아래, 망토 방패 버튼은 왼쪽 아래 + 소리 버튼
		// 밀기 모드: 폭탄 오른쪽 아래, 방패 왼쪽 아래. 조이스틱 모드: 둘 다 오른쪽에 세로로 (왼쪽은 조이스틱 자리)
		const bp = { x: W - 56, y: H - 56 }, sp = PAD === 2 ? { x: W - 56, y: H - 156 } : { x: 56, y: H - 56 };
		this.bombBtn = this.add.circle(bp.x, bp.y, 36, 0xffe3f0, 0.9).setStrokeStyle(4, 0x7a4b6b).setDepth(20).setInteractive({ useHandCursor: true });
		this.bombBtn.on('pointerdown', () => this.useBomb());
		this.add.image(bp.x, bp.y - 6, 'bomb').setDepth(21);
		this.bombTxt = txt(this, bp.x, bp.y + 26, '', 18).setDepth(21);
		this.shieldBtn = this.add.circle(sp.x, sp.y, 36, 0xfff6c8, 0.9).setStrokeStyle(4, 0x7a4b6b).setDepth(20).setInteractive({ useHandCursor: true });
		this.shieldBtn.on('pointerdown', () => this.useShield());
		this.add.image(sp.x, sp.y - 6, 'capeIcon').setDepth(21);
		this.shieldTxt = txt(this, sp.x, sp.y + 26, '', 18).setDepth(21);
		this.shieldImg = this.add.image(0, 0, 'capeShield').setDepth(6).setVisible(false);
		soundBtn(this, W - 26, 64).setDepth(20);
		this.refreshUI();

		// 입력: 드래그(터치/마우스) + 키보드
		this.cur = this.input.keyboard.createCursorKeys();
		this.wasd = this.input.keyboard.addKeys('W,A,S,D');
		this.input.addPointer(1); // 한 손가락으로 이동, 다른 손가락으로 폭탄 버튼
		this.input.on('pointerdown', (p, over) => {
			if (over.length || this.over) return; // 버튼 위에서 시작한 터치는 이동으로 쓰지 않는다
			if (p.y < PAD_Y) return; // 아래 패드에서 시작한 터치만 이동
			if (PAD === 2 && Phaser.Math.Distance.Between(p.x, p.y, JOY_POS.x, JOY_POS.y) > 150) return; // 조이스틱 모드: 조이스틱 근처에서 시작한 터치만
			this.dragS = { ptr: p, px: p.x, py: p.y, x: this.player.x, y: this.player.y };

			this.endTut();
		});
		this.input.on('pointerup', p => { if (this.dragS && this.dragS.ptr === p) this.dragS = null; });
		this.input.keyboard.on('keydown-SPACE', () => this.useBomb());
		this.input.keyboard.on('keydown-B', () => this.useBomb());
		this.input.keyboard.on('keydown-V', () => this.useShield());
		this.input.keyboard.on('keydown-M', () => SFX.toggle());
		this.setupPad();

		// 자동 연사
		this.time.addEvent({ delay: 170, loop: true, callback: () => { if (!this.over) this.fire(); } });

		// 충돌
		this.physics.add.overlap(this.pBul, this.enemies, (b, e) => this.hitEnemy(b, e));
		this.physics.add.overlap(this.player, this.eBul, (p, b) => { b.destroy(); this.hurt(); });
		// 입장(enter) 중인 적도 맞출 수 있고 부딪히면 피해를 준다 (갤러그처럼). 'wait'는 아직 화면에 안 나온 적
		this.physics.add.overlap(this.player, this.enemies, (p, e) => { if (e.mode !== 'wait') this.hurt(); });
		this.physics.add.overlap(this.player, this.items, (p, i) => this.collect(i));

		// 웨이브 일정 (갤러그식 곡선 입장)
		this.banner(tr('stage', this.stage), '#ff6b81');
		if (PARAMS.has('boss')) {
			this.wavesSpawned = this.totalWaves;
			this.bossCalled = true;
			this.time.delayedCall(1200, () => this.spawnBoss());
		} else {
			for (let w = 1; w <= this.totalWaves; w++) this.time.delayedCall(1500 + (w - 1) * 6500, () => this.wave(w));
		}
		// 안전장치: 60초 지나면 남은 적이 있어도 보스 등장
		this.time.delayedCall(60000, () => this.callBoss());
	}

	// 이번 맵에서 차례로 나올 보스: 매 맵 소보스 → 3맵마다 중보스 → 7맵·15맵 최종보스
	makeBossQueue(s) {
		const q = [{ tier: 'small', n: (s - 1) % 5, v: Math.floor((s - 1) / 5) }];
		if (s % 3 === 0) q.push({ tier: 'mid', n: (s / 3 - 1) % 5 });
		if (s === 7) q.push({ tier: 'final', n: 0 });
		if (s === 15) q.push({ tier: 'final', n: 1 });
		return q;
	}

	// ----- UI -----
	refreshUI() {
		this.hearts.forEach((h, i) => h.setTexture(i < this.hp ? 'heart' : 'heart_e'));
		this.scoreTxt.setText(String(this.score));
		this.wIcon.setTexture(ITEM_TEX[this.wtype]);
		this.powTxt.setText('Lv.' + this.wlevel + (this.wlevel >= W_MAX ? ' MAX' : ''));
		this.bombTxt.setText('x' + this.bombs);
		this.bombBtn.setAlpha(this.bombs > 0 ? 0.9 : 0.4);
		this.shieldTxt.setText('x' + this.shields);
		this.shieldBtn.setAlpha(this.shields > 0 ? 0.9 : 0.4);
	}
	banner(s, color) {
		const t = txt(this, W / 2, 300 + MY, s, s.length > 12 ? 34 : 44, color || '#ff6b81').setDepth(30);
		this.tweens.add({ targets: t, alpha: 0, y: 260 + MY, duration: 1600, delay: 500, onComplete: () => t.destroy() });
	}
	burst(x, y, n) {
		const em = this.add.particles(x, y, 'spark', {
			speed: { min: 60, max: 240 }, lifespan: 550, scale: { start: 1.3, end: 0 },
			emitting: false
		}).setDepth(15);
		em.explode(n);
		this.time.delayedCall(700, () => em.destroy());
	}

	// ----- 플레이어 -----
	// 무기별 발사: 총알(노란 국화)은 부채꼴로 많이, 레이저(분홍 벚꽃)는 적을 꿰뚫고, 유도탄(빨간 꽃)은 적을 따라간다
	fire() {
		const p = this.player, ey = p.y - 8, L = this.wlevel, T = this.wtype;
		let shots = [], glint = [];
		if (T === 'bullet') {
			const pat = {
				1: [[-6, 0], [6, 0]], 2: [[-8, -55], [0, 0], [8, 55]],
				3: [[-9, -110], [-3, -35], [3, 35], [9, 110]], 4: [[-10, -170], [-5, -85], [0, 0], [5, 85], [10, 170]]
			}[L];
			shots = pat.map(([dx, vx]) => ({ dx, vx, vy: -700, key: 'pbul', dmg: 1 }));
			glint = [-7, 7];
		} else if (T === 'laser') {
			let xs;
			if (L === 1) { this.eyeSide ^= 1; xs = [this.eyeSide ? 7 : -7]; } else if (L === 2) xs = [-7, 7]; else xs = [-9, 0, 9];
			shots = xs.map(dx => ({ dx, vx: 0, vy: -760, key: Math.random() < 0.5 ? 'pbullet' : 'pbullet2', dmg: L >= 4 ? 2 : 1, pierce: true }));
			glint = xs.filter(x => x !== 0);
		} else {
			if (++this.fireTick % 2) return; // 유도탄은 두 번에 한 번 발사
			const n = L, dmg = [1, 2, 2, 3][L - 1];
			for (let i = 0; i < n; i++) shots.push({ dx: (i - (n - 1) / 2) * 11, vx: (i - (n - 1) / 2) * 80, vy: -420, key: 'pmis', dmg, homing: true, k: i });
		}
		SFX.shoot();
		shots.forEach(sh => {
			const b = this.pBul.create(p.x + sh.dx, sh.homing ? p.y - 14 : ey, sh.key).setDepth(4);
			b.dmg = sh.dmg; b.pierce = !!sh.pierce; b.homing = !!sh.homing; b.k = sh.k || 0;
			if (sh.key === 'pbul') b.body.setSize(7, 11).setOffset(1, 1);
			else if (sh.homing) { b.body.setSize(8, 14).setOffset(3, 3); b.setRotation(Math.atan2(sh.vy, sh.vx) + Math.PI / 2); }
			else b.body.setSize(7, 12).setOffset(2, 0); // 레이저 판정은 머리 부분만
			b.body.setVelocity(sh.vx, sh.vy);
		});
		glint.forEach(dx => this.eyeGlint(p.x + dx, ey + 1));
	}
	// 유도탄: 가장 가까운 적부터 차례로 하나씩 맡아 따라간다
	homing(dt) {
		const p = this.player;
		const list = this.enemies.getChildren().filter(e => e.active && e.mode !== 'wait' && e.mode !== 'boss_in' && e.y > -10)
			.sort((a, b) => Phaser.Math.Distance.Between(a.x, a.y, p.x, p.y) - Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y));
		this.pBul.children.each(b => {
			if (!b.active || !b.homing) return;
			if (!b.tgt || !b.tgt.active || b.tgt.mode === 'wait') b.tgt = list.length ? list[b.k % list.length] : null;
			const v = b.body.velocity, sp = Math.min(580, Math.hypot(v.x, v.y) + 700 * dt);
			let ang = Math.atan2(v.y, v.x);
			if (b.tgt) ang += Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(Math.atan2(b.tgt.y - b.y, b.tgt.x - b.x) - ang), -6 * dt, 6 * dt);
			b.body.setVelocity(Math.cos(ang) * sp, Math.sin(ang) * sp);
			b.rotation = ang + Math.PI / 2;
		});
	}
	// 눈에서 번쩍 (쏠 때마다 잠깐)
	eyeGlint(x, y) {
		const f = this.add.image(x, y, 'eyeflash').setDepth(6).setScale(0.6).setTint({ bullet: 0xffe066, laser: 0xffffff, missile: 0xff8a9a }[this.wtype]);
		this.tweens.add({ targets: f, scale: 1.1, alpha: 0, duration: 120, onComplete: () => f.destroy() });
	}
	hurt() {
		if (this.over || this.god || this.time.now < this.invuln || this.time.now < this.shieldUntil) return;
		this.hp--;
		SFX.hurt();
		this.invuln = this.time.now + 1500;
		this.cameras.main.shake(150, 0.004);
		this.eBul.clear(true, true); // 맞으면 화면 탄 정리 (너그러운 룰)
		this.refreshUI();
		if (this.hp <= 0) this.end(false);
	}
	collect(it) {
		if (WEAPONS.includes(it.kind)) this.getWeapon(it.kind);
		else if (it.kind === 'bomb') this.bombs = Math.min(5, this.bombs + 1);
		else if (it.kind === 'shield') this.shields = Math.min(3, this.shields + 1);
		else this.hp = Math.min(this.df.hp, this.hp + 1);
		SFX.item(it.kind);
		this.burst(it.x, it.y, 6);
		it.destroy();
		this.refreshUI();
	}
	// 같은 꽃은 레벨업, 다른 꽃은 종류가 바뀌며 한 단계 내려간다
	getWeapon(t) {
		if (t === this.wtype) this.wlevel = Math.min(W_MAX, this.wlevel + 1);
		else { this.wtype = t; this.wlevel = Math.max(1, this.wlevel - 1); }
		this.score += 200;
		const x = this.add.text(this.player.x, this.player.y - 46, 'Lv.' + this.wlevel + (this.wlevel >= W_MAX ? ' MAX' : ''), {
			fontFamily: FONT, fontSize: '22px', color: '#' + ITEM_COL[t].toString(16).padStart(6, '0'), fontStyle: 'bold', stroke: '#7a4b6b', strokeThickness: 5
		}).setOrigin(0.5).setDepth(25);
		this.tweens.add({ targets: x, y: x.y - 40, alpha: 0, duration: 900, onComplete: () => x.destroy() });
	}

	// ----- 적 생성 -----
	// p0 -> p1(제어점) -> p2 를 따라 이동하는 곡선 이동
	moveBez(e, p0, p1, p2, dur, delay, ease, done) {
		e.tw = this.tweens.addCounter({
			from: 0, to: 1, duration: dur, delay: delay || 0, ease: ease || 'Linear',
			onStart: () => { if (e.active) { e.setVisible(true); e.body.enable = true; if (e.mode === 'wait') e.mode = 'enter'; } },
			onUpdate: tw => {
				if (!e.active) return;
				const v = tw.getValue();
				e.x = QB(v, p0.x, p1.x, p2.x);
				e.y = QB(v, p0.y, p1.y, p2.y);
			},
			onComplete: () => { if (e.active && done) done(); }
		});
	}
	spawnEnemy(kind, slot, from, delay) {
		const e = this.enemies.create(from.x, from.y, kind).setDepth(3);
		e.kind = kind; e.hp = kind === 'macaron' ? (this.stage >= 10 ? 3 : 2) : 1;
		e.slotX = slot.x; e.slotY = slot.y + 40; e.mode = 'wait'; slot = { x: slot.x, y: slot.y + 40 }; // 화면이 길어진 만큼 편대를 아래로
		e.setVisible(false); e.body.enable = false;
		e.body.setSize(e.width * 0.8, e.height * 0.8, true);
		const ctrl = { x: W / 2 + (from.x < W / 2 ? -80 : 80), y: -180 };
		this.moveBez(e, from, ctrl, slot, 1600, delay, 'Sine.easeInOut', () => this.toHold(e));
		return e;
	}
	toHold(e) {
		e.mode = 'hold';
		e.nextFire = this.time.now + Phaser.Math.Between(1500, 3500) * this.df.fire;
		e.diveAt = this.time.now + Phaser.Math.Between(4000, 9000) / HARD_K;
	}
	dive(e) {
		e.mode = 'dive';
		const p0 = { x: e.x, y: e.y };
		const p1 = { x: e.x + (e.x < W / 2 ? 170 : -170), y: e.y + 280 };
		const p2 = { x: this.player.x, y: H + 60 };
		let shot = false;
		const chk = this.time.addEvent({ delay: 100, loop: true, callback: () => {
			if (!e.active) { chk.remove(); return; }
			if (!shot && e.y > 340) { shot = true; this.aimShot(e, 170); }
		} });
		this.moveBez(e, p0, p1, p2, 2400, 0, 'Sine.easeIn', () => {
			chk.remove();
			// 화면 아래로 나갔다가 위에서 다시 자기 자리로 복귀
			e.setPosition(e.slotX, -40);
			e.mode = 'return';
			this.moveBez(e, { x: e.slotX, y: -40 }, { x: e.slotX, y: e.slotY * 0.5 }, { x: e.slotX, y: e.slotY }, 1100, 0, 'Sine.easeOut', () => this.toHold(e));
		});
	}
	eBullet(x, y, ang, speed) {
		const b = this.eBul.create(x, y, 'ebullet').setDepth(6);
		b.body.setCircle(3.5, 2, 2);
		const s = speed * this.df.bs;
		b.body.setVelocity(Math.cos(ang) * s, Math.sin(ang) * s);
		return b;
	}
	aimShot(e, speed) {
		this.eBullet(e.x, e.y, Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y), speed);
	}

	// ----- 웨이브 -----
	wave(n) {
		this.wavesSpawned = n;
		SFX.wave();
		const s = this.stage, pat = (s + n) % 4;
		// 적 수는 예전보다 약 20% 늘렸다 (8→10, 7→8, 5+5→6+6, 7→9, 마지막 줄 5→6)
		const row = (n, m) => Array.from({ length: n }, (_, i) => m + i * (W - 2 * m) / (n - 1));
		if (pat === 0) {          // 한 줄(왼쪽에서 입장)
			row(10, 38).forEach((x, i) => this.spawnEnemy(s > 5 && i % 3 === 1 ? 'macaron' : 'jelly', { x, y: 120 }, { x: -40, y: 350 }, i * 150));
		} else if (pat === 1) {   // 마카롱 한 줄(오른쪽에서 입장)
			row(8, 54).forEach((x, i) => this.spawnEnemy('macaron', { x, y: 190 }, { x: W + 40, y: 350 }, i * 180));
		} else if (pat === 2) {   // 두 줄 섞기
			row(6, 62).forEach((x, i) => {
				this.spawnEnemy(i % 2 ? 'jelly2' : 'jelly3', { x, y: 130 }, { x: -40, y: 200 }, i * 180);
				this.spawnEnemy('macaron', { x, y: 250 }, { x: W + 40, y: 200 }, 100 + i * 180);
			});
		} else {                  // V자 편대
			row(9, 36).forEach((x, i) => this.spawnEnemy(i % 2 ? 'jelly2' : 'macaron', { x, y: 110 + Math.abs(i - 4) * 32 }, { x: i < 5 ? -40 : W + 40, y: 300 }, i * 150));
		}
		// 뒤쪽 맵일수록 마지막 웨이브에 한 줄 추가
		if (s >= 8 && n === this.totalWaves)
			row(6, 62).forEach((x, i) => this.spawnEnemy('jelly3', { x, y: 290 }, { x: i % 2 ? -40 : W + 40, y: 120 }, 400 + i * 140));
	}
	callBoss() {
		if (this.bossCalled || this.over) return;
		this.bossCalled = true;
		this.time.delayedCall(1200, () => this.spawnBoss());
	}

	// 보스 정의: 등급별 이름표 + 체력 + 몸 크기 + 단계별 공격 목록
	// 공격: aim(조준 부채꼴) ring(원형) spiral(나선) rain(위에서 비) curtain(구멍 뚫린 탄막 벽)
	bossDef(q) {
		const hb = this.df.boss / 60 * 1.5, s = this.stage; // 새 무기가 강해진 만큼 보스 체력 +50%
		const A = (n, sp, v, e) => ({ p: 'aim', n, sp, v, e }), R = (n, v, e) => ({ p: 'ring', n, v, e });
		const S = (arms, v, e) => ({ p: 'spiral', arms, v, e }), Rn = (n, v, e) => ({ p: 'rain', n, v, e });
		const C = (v, e) => ({ p: 'curtain', v, e });
		if (q.tier === 'small') {
			const key = 'sb' + q.n + (q.v ? '_' + q.v : '');
			const ph = [
				[[A(3, .25, 180, 1400)], [A(3, .25, 190, 1500), R(8, 140, 2200)]],
				[[A(5, .12, 210, 1300)], [S(2, 150, 380), A(3, .2, 200, 1800)]],
				[[Rn(3, 150, 700)], [Rn(4, 170, 600), A(3, .3, 180, 1800)]],
				[[R(10, 130, 1800)], [R(12, 140, 1600), A(1, 0, 240, 700)]],
				[[S(2, 140, 420)], [S(3, 150, 380), A(3, .25, 190, 1700)]]
			][q.n];
			return { key, hp: Math.round((12 + s * 2) * hb), scale: 1, sx: 120, y: 190, phases: ph, w: 60, h: 50 };
		}
		if (q.tier === 'mid') {
			const ph = [
				[[R(8, 140, 2000)], [S(3, 150, 360), A(3, .25, 190, 1900)], [R(12, 150, 1500), Rn(3, 160, 800)]],
				[[A(3, .25, 190, 1400), Rn(2, 140, 900)], [A(5, .1, 230, 1100)], [R(10, 150, 1700), A(3, .3, 200, 1500)]],
				[[S(1, 150, 300)], [A(7, .09, 200, 1500)], [S(2, 170, 300), R(8, 140, 2200)]],
				[[Rn(3, 160, 700)], [R(12, 150, 1800)], [S(2, 150, 340), A(3, .3, 210, 1600)]],
				[[A(3, .3, 170, 1300)], [R(14, 140, 1800)], [S(2, 150, 350), Rn(3, 150, 800)]]
			][q.n];
			return { key: 'mb' + q.n, hp: Math.round((36 + s * 3) * hb), scale: 1, sx: 140, y: 205, phases: ph, w: 80, h: 60 };
		}
		// 최종보스 UFO (15맵은 더 크고 빠름)
		const hard = q.n === 1, f = hard ? 0.8 : 1;
		const ph = [
			[A(3, .3, 190, 1300 * f)],
			[R(12, 150, 1700 * f), A(3, .25, 200, 1700 * f)],
			[S(2, 160, 340 * f), C(130, 3000 * f)],
			[S(3, 170, 320 * f), A(5, .15, 220, 1500 * f), C(140, 2600 * f)]
		].map(a => (Array.isArray(a) ? a : [a]));
		return { key: 'ub' + q.n, hp: Math.round((hard ? 150 : 100) * hb), scale: hard ? 1.2 : 1, sx: 110, y: 215, phases: ph, w: 100, h: 55 };
	}
	spawnBoss() {
		if (this.over) return;
		const q = this.bossQueue.shift();
		if (!q) return;
		const d = this.bossDef(q);
		this.banner(tr(q.tier === 'small' ? 'boss' : q.tier === 'mid' ? 'midBoss' : 'finalBoss'), '#7a4b6b');
		SFX.bossIn();
		const b = this.enemies.create(W / 2, -80, d.key).setDepth(3).setScale(d.scale);
		b.isBoss = true; b.mode = 'boss_in'; b.kind = d.key; b.def = d; b.tier = q.tier;
		b.maxHp = b.hp = d.hp;
		b.body.setSize(d.w, d.h, true);
		b.atk = 0; b.ang = 0; b.next = [];
		this.boss = b;
		this.tweens.add({ targets: b, y: d.y, duration: 2200, ease: 'Sine.easeOut', onComplete: () => { b.mode = 'boss'; b.t0 = this.time.now; b.atk = this.time.now + 800; } });
	}

	// ----- 피격/처치 -----
	hitEnemy(b, e) {
		if (!e.active || e.mode === 'wait' || e.mode === 'boss_in') return;
		if (b.pierce) { b.hit = b.hit || new Set(); if (b.hit.has(e)) return; b.hit.add(e); } // 레이저는 꿰뚫고 지나간다(적마다 한 번)
		else { if (b.homing) this.burst(b.x, b.y, 4); b.destroy(); }
		this.damage(e, b.dmg || 1);
	}
	// 총알과 폭탄이 함께 쓰는 피해 처리
	damage(e, n) {
		e.hp -= n;
		e.setTintFill(0xffffff);
		this.time.delayedCall(60, () => { if (e.active) e.clearTint(); });
		if (e.hp <= 0) this.kill(e);
		else SFX.tick();
	}
	kill(e) {
		if (e.tw) e.tw.stop();
		this.score += e.isBoss ? { small: 1500, mid: 3000, final: 6000 }[e.tier] : 100;
		SFX.pop(e.isBoss);
		this.burst(e.x, e.y, e.isBoss ? 40 : 10);
		if (e.isBoss) {
			this.boss = null;
			this.bossBar.clear();
			this.eBul.clear(true, true);
			e.destroy();
			this.refreshUI();
			// 남은 보스가 있으면 이어서 등장, 없으면 맵 클리어
			if (this.bossQueue.length) this.time.delayedCall(1800, () => this.spawnBoss());
			else this.time.delayedCall(1500, () => this.stageClear());
			return;
		}
		// 꽃 무기 약 10%(지금 쓰는 꽃이 조금 더 잘 나옴), 우산(방패)·폭탄 각 2%, 하트 1%
		const r = Math.random();
		if (r < 0.105) {
			const w = WEAPONS.map(k => (k === this.wtype ? 1.6 : 1)), tot = w.reduce((a, b) => a + b);
			let q = Math.random() * tot, k = 0;
			while (k < 2 && q >= w[k]) q -= w[k++];
			this.drop(e.x, e.y, WEAPONS[k]);
		} else if (r < 0.125) { if (this.shields < 3) this.drop(e.x, e.y, 'shield'); }
		else if (r < 0.145) { if (this.bombs < 5) this.drop(e.x, e.y, 'bomb'); }
		else if (r < 0.155 && this.hp < this.df.hp) this.drop(e.x, e.y, 'heart');
		e.destroy();
		this.refreshUI();
	}
	drop(x, y, kind) {
		const it = this.items.create(x, y, ITEM_TEX[kind]).setDepth(5);
		it.kind = kind;
		it.body.setVelocity(0, 110);
		// 적과 구분되도록: 종류별 색 후광(두근두근 커졌다 작아짐) + 좌우 살랑살랑
		const col = ITEM_COL[kind];
		const halo = this.add.circle(x, y, 32, 0xffffff, 0.55).setStrokeStyle(4, col).setDepth(4);
		this.tweens.add({ targets: halo, scale: 1.3, alpha: 0.25, duration: 450, yoyo: true, repeat: -1 });
		this.tweens.add({ targets: it, angle: { from: -12, to: 12 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		it.halo = halo;
		it.once('destroy', () => { this.tweens.killTweensOf([halo, it]); halo.destroy(); });
	}

	// ----- 폭탄 -----
	// 말티푸가 입으로 장미 폭탄을 뱉는다. 폭탄이 날아가 터지면 화면의 적 탄을 모두 지우고,
	// 일반 적은 한 방에 처치, 보스에게는 8 피해. 뱉는 순간부터 잠깐 무적.
	useBomb() {
		if (this.over || this.time.now < this.bombCd) return;
		if (this.bombs <= 0) { SFX.empty(); return; }
		this.bombs--;
		this.bombCd = this.time.now + 700;
		this.invuln = Math.max(this.invuln, this.time.now + 1500);
		SFX.bomb();
		const p = this.player, tx = p.x, ty = Math.max(160, p.y - 300);
		p.setTexture(CHAR + '_o');
		this.time.delayedCall(350, () => { if (p.active) p.setTexture(CHAR); });
		const b = this.add.image(p.x, p.y + 6, 'bomb').setDepth(7).setScale(0.4);
		this.tweens.add({ targets: b, scale: 1.2, angle: 540, duration: 520, ease: 'Sine.easeOut' });
		this.tweens.add({
			targets: b, x: tx, y: ty, duration: 520, ease: 'Cubic.easeOut',
			onComplete: () => { b.destroy(); if (!this.over) this.detonate(tx, ty); }
		});
		this.refreshUI();
	}
	detonate(x, y) {
		this.cameras.main.flash(250, 255, 225, 240);
		this.roseBloom(x, y);
		this.eBul.clear(true, true);
		this.enemies.getChildren().slice().forEach(e => {
			if (!e.active || e.mode === 'wait' || e.mode === 'boss_in') return;
			this.damage(e, e.isBoss ? 8 : 99);
		});
		this.refreshUI();
	}

	// 장미꽃이 활짝 피며 터지는 폭탄 연출: 퍼지는 분홍 파동 + 작은 장미들이 사방으로 + 꽃잎 비
	roseBloom(x, y) {
		const ring = this.add.image(x, y, 'shock').setDepth(25).setScale(0.3);
		this.tweens.add({ targets: ring, scale: 4.2, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
		for (let i = 0; i < 12; i++) {
			const a = i * Math.PI / 6, r = this.add.image(x, y, 'rose').setDepth(26).setScale(0.7);
			this.tweens.add({
				targets: r, x: x + Math.cos(a) * 340, y: y + Math.sin(a) * 340, angle: 360, scale: 1.3, alpha: 0,
				duration: 800, ease: 'Cubic.easeOut', onComplete: () => r.destroy()
			});
		}
		const em = this.add.particles(x, y, 'petal', {
			speed: { min: 80, max: 420 }, lifespan: 1200, scale: { start: 1.4, end: 0.4 }, alpha: { start: 1, end: 0 },
			rotate: { min: 0, max: 360 }, gravityY: 120, tint: [0xff9fb5, 0xff6b81, 0xffc2d4], emitting: false
		}).setDepth(27);
		em.explode(60);
		this.time.delayedCall(1400, () => em.destroy());
	}

	// ----- 망토 방패 -----
	// 6초 동안 망토가 활짝 펼쳐져 감싸며 탄을 모두 막고, 닿는 적에게 피해를 준다
	useShield() {
		if (this.over || this.time.now < this.shieldUntil) return;
		if (this.shields <= 0) { SFX.empty(); return; }
		this.shields--;
		this.shieldTotal = 6000;
		this.shieldStart = this.time.now;
		this.shieldUntil = this.time.now + this.shieldTotal;
		SFX.shield();
		this.cameras.main.flash(200, 255, 248, 210);
		this.refreshUI();
	}
	shieldUpdate(time) {
		const on = time < this.shieldUntil, p = this.player;
		this.shieldImg.setVisible(on);
		if (!on) return;
		const left = this.shieldUntil - time;
		const open = Math.min(1, (time - this.shieldStart) / 220); // 망토가 펼쳐지는 동안 점점 커진다
		this.shieldImg.setPosition(p.x, p.y).setScale((0.3 + 0.7 * open) * (1 + Math.sin(time / 180) * 0.04))
			.setAlpha(left < 1500 ? (Math.floor(time / 90) % 2 ? 0.35 : 1) : 1); // 끝나갈 땐 깜빡
		const R = 92;
		this.eBul.children.each(b => { if (b.active && Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y) < R) b.destroy(); });
		this.enemies.children.each(e => {
			if (!e.active || e.mode === 'wait' || e.mode === 'boss_in') return;
			if (Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < R + e.displayWidth * 0.3 && time > (e.shAt || 0)) {
				e.shAt = time + 300;
				this.damage(e, e.isBoss ? 1 : 99);
			}
		});
	}

	// ----- 맵 클리어 / 종료 화면 -----
	stageClear() {
		if (this.over) return;
		if (this.stage >= MAX_STAGE) { this.end(true); return; }
		this.over = true;
		SFX.clear();
		hiScore(this.score);
		this.eBul.clear(true, true);
		this.add.rectangle(0, 0, W, H, 0xffffff, 0.45).setOrigin(0).setDepth(40);
		txt(this, W / 2, 330 + MY, tr('stageClear'), 40, '#ff6b81').setDepth(41);
		txt(this, W / 2, 400 + MY, tr('score') + ' ' + this.score, 28).setDepth(41);
		this.burst(W / 2, 300 + MY, 40);
		// 보상: 체력 +1, 3맵마다 폭탄·방패 +1
		const nx = {
			score: this.score, wtype: this.wtype, wlevel: this.wlevel,
			hp: Math.min(this.df.hp, this.hp + 1),
			bombs: Math.min(5, this.bombs + (this.stage % 3 === 0 ? 1 : 0)),
			shields: Math.min(3, this.shields + (this.stage % 3 === 0 ? 1 : 0))
		};
		this.time.delayedCall(2200, () => this.scene.restart({ level: this.level, stage: this.stage + 1, carry: nx }));
	}
	end(win) {
		if (this.over) return;
		this.over = true;
		if (win) SFX.clear(); else SFX.over();
		this.player.setVisible(false);
		this.shieldImg.setVisible(false);
		hiScore(this.score);
		this.add.rectangle(0, 0, W, H, 0xffffff, 0.55).setOrigin(0).setDepth(40);
		txt(this, W / 2, 250 + MY, win ? tr('allClear') : tr('gameOver'), win ? 44 : 48, win ? '#ff6b81' : '#7a4b6b').setDepth(41);
		txt(this, W / 2, 330 + MY, tr('score') + ' ' + this.score, 32).setDepth(41);
		txt(this, W / 2, 375 + MY, tr('best') + ' ' + hiScore(), 22).setDepth(41);
		button(this, W / 2, 470 + MY, 260, 64, tr('retry'), 0xfff3b0, () => this.scene.restart({ level: this.level, stage: 1 })).forEach(o => o.setDepth(41));
		button(this, W / 2, 550 + MY, 260, 64, tr('home'), 0xbff0d4, () => this.scene.start('Title')).forEach(o => o.setDepth(41));
		if (win) this.burst(W / 2, 200 + MY, 60);
	}

	// ----- 하단 터치 패드: 1 밀기(좌우), 2 조이스틱(전후좌우) -----
	setupPad() {
		const line = PAD === 1 ? 0xff9fb5 : 0x9fd8ff;
		this.padLine = line;
		let cy;
		if (PAD === 1) { // 밀기: 아래 가로 패드와 좌우 홈(레일)
			const h = H - PAD_Y - 8, g = this.add.graphics().setDepth(15);
			g.fillStyle(0xffd6e7, 0.6).fillRoundedRect(8, PAD_Y, W - 16, h, 26);
			g.lineStyle(4, line, 1).strokeRoundedRect(8, PAD_Y, W - 16, h, 26);
			cy = PAD_Y + h / 2 + 4;
			g.lineStyle(8, line, 0.8).lineBetween(60, cy, W - 60, cy);
			g.fillStyle(line, 0.8).fillCircle(60, cy, 8).fillCircle(W - 60, cy, 8);
		} else {         // 조이스틱: 왼쪽 아래 둥근 조이스틱(고정), 패드 판은 없다
			this.joyG = this.add.graphics().setDepth(16);
			this.joy = JOY_POS;
			cy = JOY_POS.y;
		}
		this.padCy = cy;

		// 손가락 안내: 처음엔 좌우로 왔다갔다, 이후엔 터치를 따라다닌다
		const cx = PAD === 1 ? W / 2 : JOY_POS.x, span = PAD === 1 ? 110 : 34;
		this.finger = this.add.image(cx, cy, 'finger').setOrigin(0.4, 0.05).setDepth(22);
		this.tut = true;
		this.fingerTween = this.tweens.add({ targets: this.finger, x: { from: cx - span, to: cx + span }, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		this.tutTxt = [txt(this, W / 2, PAD === 1 ? PAD_Y - 26 : H - 215, tr('hint')[PAD], 20, '#7a4b6b').setDepth(22)];
		this.time.delayedCall(8000, () => this.endTut());
		if (this.carry) this.endTut(); // 2맵부터는 안내 생략 (터치하면 손가락은 계속 따라다님)
	}

	endTut() {
		if (!this.tut) return;
		this.tut = false;
		this.fingerTween.stop();
		this.finger.setAlpha(0);
		this.tutTxt.forEach(t => this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() }));
	}

	// 조이스틱 입력: 받침 중심에서 손가락까지의 거리(최대 JOY_R)가 곧 속도
	joyVec(ds) {
		if (!ds || !ds.ptr.isDown) return { x: 0, y: 0, kx: 0, ky: 0 };
		let dx = ds.ptr.x - this.joy.x, dy = ds.ptr.y - this.joy.y;
		const len = Math.hypot(dx, dy);
		if (len > JOY_R) { dx = dx / len * JOY_R; dy = dy / len * JOY_R; }
		const dead = (v) => Math.abs(v) < 8 ? 0 : v / JOY_R; // 살짝 닿은 정도는 무시
		return { x: dead(dx), y: dead(dy), kx: dx, ky: dy };
	}

	padUpdate() {
		const ds = this.dragS, down = !!(ds && ds.ptr.isDown);
		if (!this.tut) {
			const f = this.finger;
			if (down) { f.x = Phaser.Math.Clamp(ds.ptr.x, 16, W - 16); f.y = Phaser.Math.Clamp(ds.ptr.y, PAD_Y + 8, H - 40); }
			else if (this.joyG) f.setPosition(JOY_POS.x, JOY_POS.y);
			f.setAlpha(f.alpha + ((down ? 1 : 0) - f.alpha) * 0.3).setScale(down ? 0.9 : 1);
		}
		if (this.joyG) {
			const v = this.joyVec(ds), j = this.joy, a = down ? 0.85 : 0.45;
			this.joyG.clear();
			this.joyG.fillStyle(0xffffff, 0.35 * (down ? 1.4 : 1)).fillCircle(j.x, j.y, JOY_R + 10);
			this.joyG.lineStyle(4, this.padLine, a).strokeCircle(j.x, j.y, JOY_R + 10);
			this.joyG.lineStyle(2, this.padLine, a * 0.7).strokeCircle(j.x, j.y, JOY_R * 0.5);
			this.joyG.fillStyle(this.padLine, a).fillCircle(j.x + v.kx, j.y + v.ky, 24);
			this.joyG.lineStyle(4, 0x7a4b6b, a).strokeCircle(j.x + v.kx, j.y + v.ky, 24);
		}
	}

	// ----- 매 프레임 -----
	update(time, delta) {
		this.cl1.tilePositionY -= 0.6;
		this.cl2.tilePositionY -= 1.4;
		if (this.over) return;
		const p = this.player;

		// 이동: 밀기(좌우) / 조이스틱(전후좌우) 또는 키보드
		const ds = this.dragS, k = this.cur, w = this.wasd, dt = delta / 1000;
		const kx = (k.right.isDown || w.D.isDown ? 1 : 0) - (k.left.isDown || w.A.isDown ? 1 : 0);
		const ky = (k.down.isDown || w.S.isDown ? 1 : 0) - (k.up.isDown || w.W.isDown ? 1 : 0);
		if (PAD === 1) {
			if (ds && ds.ptr.isDown) p.x += (ds.x + ds.ptr.x - ds.px - p.x) * 0.4; // 손가락이 민 만큼 1:1
			else p.x += kx * 5;
			p.y = PLAYER_Y;
		} else {
			const v = this.joyVec(ds);
			p.x += (v.x || kx) * JOY_SPEED * dt;
			p.y += (v.y || ky) * JOY_SPEED * dt;
			p.y = Phaser.Math.Clamp(p.y, 120, H - 50);
		}
		this.padUpdate();
		this.homing(dt);
		p.x = Phaser.Math.Clamp(p.x, 24, W - 24);
		p.setAlpha(time < this.invuln && Math.floor(time / 80) % 2 ? 0.3 : 1);

		// 적 행동
		let divers = 0;
		this.enemies.children.each(e => { if (e.active && e.mode === 'dive') divers++; });
		this.enemies.children.each(e => {
			if (!e.active) return;
			if (e.mode === 'hold') {
				e.x = e.slotX + Math.sin(time / 600 + e.slotX) * 18;
				e.y = e.slotY + Math.sin(time / 900 + e.slotX) * 6;
				if (time > e.nextFire) {
					this.aimShot(e, 150);
					e.nextFire = time + Phaser.Math.Between(2500, 5000) * this.df.fire * (1 - (this.stage - 1) * 0.025);
				}
				if (time > e.diveAt && divers < 2 && this.wavesSpawned >= 1) { divers++; this.dive(e); }
			}
		});
		if (this.boss) this.bossUpdate(this.boss, time);
		this.shieldUpdate(time);

		this.items.children.each(i => { if (i.active && i.halo) i.halo.setPosition(i.x, i.y); });

		// 화면 밖 정리
		[this.pBul, this.eBul, this.items].forEach(g => g.children.each(o => {
			if (o.active && (o.y < -30 || o.y > H + 30 || o.x < -30 || o.x > W + 30)) o.destroy();
		}));

		// 모든 웨이브 소환 후 적이 다 없어지면 보스 호출
		if (this.wavesSpawned >= this.totalWaves && !this.bossCalled && this.enemies.countActive() === 0) this.callBoss();
	}

	bossUpdate(b, time) {
		// 체력바
		this.bossBar.clear();
		this.bossBar.fillStyle(0xffffff, 0.8).fillRect(60, 52, W - 120, 12);
		this.bossBar.fillStyle(0xff6b81, 1).fillRect(62, 54, (W - 124) * (b.hp / b.maxHp), 8);
		if (b.mode !== 'boss') return;
		const d = b.def;
		b.x = W / 2 + Math.sin((time - b.t0) / 1400) * d.sx;
		b.y = d.y + Math.sin((time - b.t0) / 700) * 10;
		if (time < b.atk) return;
		// 체력 비율로 단계 결정: 단계가 올라갈수록 공격이 늘어난다
		const n = d.phases.length, r = b.hp / b.maxHp;
		const ph = Math.min(n - 1, Math.floor((1 - r) * n));
		if (b.ph !== ph) { b.ph = ph; b.next = []; } // 단계가 바뀌면 타이머 초기화
		const list = d.phases[ph], aim = Phaser.Math.Angle.Between(b.x, b.y, this.player.x, this.player.y);
		const f = this.df.fire, x = b.x, y = b.y + d.h * 0.4;
		list.forEach((a, i) => {
			if (time < (b.next[i] || 0)) return;
			b.next[i] = time + a.e * f;
			if (a.p === 'aim') {
				for (let k = 0; k < a.n; k++) this.eBullet(x, y, aim + (a.n === 1 ? 0 : (k - (a.n - 1) / 2) * a.sp), a.v);
			} else if (a.p === 'ring') {
				b.ang += 0.26;
				for (let k = 0; k < a.n; k++) this.eBullet(x, y, b.ang + k * Math.PI * 2 / a.n, a.v);
			} else if (a.p === 'spiral') {
				b.ang += 0.5;
				for (let k = 0; k < a.arms; k++) this.eBullet(x, y, b.ang + k * Math.PI * 2 / a.arms, a.v);
			} else if (a.p === 'rain') {
				for (let k = 0; k < a.n; k++) this.eBullet(Phaser.Math.Between(30, W - 30), y, Math.PI / 2, a.v);
			} else if (a.p === 'curtain') {
				// 가로 탄막 벽: 한 군데 구멍이 뚫려 있다 (구멍은 플레이어 쪽에 열어 준다)
				const gap = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-80, 80), 60, W - 60);
				for (let cx = 20; cx <= W - 20; cx += 36) if (Math.abs(cx - gap) > 56) this.eBullet(cx, y, Math.PI / 2, a.v);
			}
		});
		b.atk = time + 50;
	}
}

window.__game = new Phaser.Game({
	type: Phaser.AUTO,
	parent: 'game',
	width: W, height: H,
	backgroundColor: '#ffe9f1',
	render: { pixelArt: true },
	scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
	physics: { default: 'arcade', arcade: { debug: false } },
	scene: [Boot, Title, Game]
});
