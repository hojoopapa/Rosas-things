// Rosa's Shot - 세로 스크롤 슈팅 (15개 맵)
// 갤러그식 편대 입장/급강하 + 라이덴식 자동 연사 + 보스 탄막
// 테스트용 주소 인자: ?stage=N 시작 맵, ?boss=1 보스 바로, ?god=1 무적, ?pad=0~5 조작 방식 강제
const W = 480, H = 800;
const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "Yu Gothic", "Hiragino Sans", "Microsoft YaHei", "PingFang SC", sans-serif';
const QB = Phaser.Math.Interpolation.QuadraticBezier;
const PARAMS = new URLSearchParams(location.search);
const MAX_STAGE = 15;
// 하단 터치 패드 스타일 1~5 (사용자가 타이틀에서 선택, 저장됨). 0이면 예전 전체화면 드래그
let PAD = (() => {
	if (PARAMS.has('pad')) return Math.min(5, Math.max(0, Number(PARAMS.get('pad')) || 0));
	try { const v = Number(localStorage.getItem('rs_pad')); if (v >= 1 && v <= 5) return v; } catch (e) { /* 무시 */ }
	return 1;
})();
function setPad(v) {
	PAD = v;
	try { localStorage.setItem('rs_pad', String(v)); } catch (e) { /* 무시 */ }
}
const PAD_Y = H - 110, PLAYER_Y = H - 200;

// 난이도: hp=하트 수, bs=적 탄속 배율, fire=적 발사 간격 배율, boss=보스 체력, bomb/shield=시작 개수
const DIFF = {
	easy:   { hp: 5, bs: 0.75, fire: 1.6, boss: 40, bomb: 3, shield: 1 },
	normal: { hp: 3, bs: 1.0,  fire: 1.0, boss: 60, bomb: 2, shield: 1 },
	hard:   { hp: 3, bs: 1.25, fire: 0.7, boss: 80, bomb: 2, shield: 1 }
};
// 맵 배경 색 (3맵마다 바뀜)
const SKY_TINT = [0xffffff, 0xfff0d0, 0xdcffe8, 0xeadcff, 0xffdce8];
// 떨어지는 아이템 종류 -> 꽃 그림
const ITEM_TEX = { heart: 'sakura', star: 'sunflower', bomb: 'rose', shield: 'moonflower' };

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
	player: { px: 4, rows: [
		'..o.....o..',
		'.owo...owo.',
		'.owwwwwwwo.',
		'owwkwwwkwwo',
		'owwwwpwwwwo',
		'opwwwwwwwpo',
		'.owwwwwwwo.',
		'..bbbbbbb..',
		'.bbbbbbbbb.',
		'bbbbbbbbbbb',
		'.bb.bbb.bb.'] },
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
	// 내 총알: 진한 외곽선 + 오른쪽 아래 그림자 + 꼬리 불꽃 (불꽃 모양 2종을 섞어 일렁이게)
	pbullet: { px: 3, shadow: true, rows: [
		'...o...',
		'..oyo..',
		'.oyyyo.',
		'oyywyyo',
		'.oyyyo.',
		'..oyo..',
		'...f...',
		'..frf..',
		'..frf..',
		'...f...'] },
	pbullet2: { px: 3, shadow: true, rows: [
		'...o...',
		'..oyo..',
		'.oyyyo.',
		'oyywyyo',
		'.oyyyo.',
		'..oyo..',
		'...f...',
		'..frf..',
		'...r...'] },
	ebullet: { px: 4, rows: ['.ooo.', 'opppo', 'opwpo', 'opppo', '.ooo.'] },
	heart: { px: 4, rows: ['.oo.oo.', 'orrorro', 'orrrrro', '.orrro.', '..oro..', '...o...'] },
	star: { px: 4, rows: ['..o..', '.oyo.', 'oyyyo', '.oyo.', 'o.o.o'] },
	spark: { px: 3, rows: ['.y.', 'yyy', '.y.'] },
	bomb: { px: 4, rows: [
		'....y....',
		'....o....',
		'..ooooo..',
		'.ossssso.',
		'osswsssso',
		'oskssskso',
		'ossssssso',
		'.ossssso.',
		'..ooooo..'] }
};
// 색 바꾼 변형 (젤리 3색, 빈 하트)
const VARIANTS = {
	jelly2: ['jelly', { g: '#fff0a0' }],
	jelly3: ['jelly', { g: '#d9c7ff' }],
	heart_e: ['heart', { r: '#e6dde4' }]
};

function makeTex(scene, key, rows, px, pal, shadow) {
	if (scene.textures.exists(key)) return;
	const sh = shadow ? 1 : 0; // 그림자는 오른쪽·아래로 1칸 삐져나오므로 캔버스를 1칸 키운다
	const c = scene.textures.createCanvas(key, (rows[0].length + sh) * px, (rows.length + sh) * px);
	const ctx = c.getContext('2d');
	if (shadow) {
		// 그림자를 먼저 깔아야 본체 칸이 가려지지 않는다 (불꽃 칸은 그림자 없음)
		ctx.fillStyle = 'rgba(74,48,80,0.3)';
		rows.forEach((row, y) => [...row].forEach((ch, x) => {
			if (ch !== '.' && ch !== 'f' && ch !== 'r') ctx.fillRect((x + 1) * px, (y + 1) * px, px, px);
		}));
	}
	rows.forEach((row, y) => [...row].forEach((ch, x) => {
		if (ch === '.') return;
		ctx.fillStyle = pal[ch];
		ctx.fillRect(x * px, y * px, px, px);
	}));
	c.refresh();
}

function makeBg(scene) {
	// 하늘 그라데이션 (고정)
	let c = scene.textures.createCanvas('sky', W, H);
	let ctx = c.getContext('2d');
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, '#bfe8ff');
	g.addColorStop(1, '#ffdff0');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
	c.refresh();
	// 구름 (세로로 이어 붙는 스크롤용, 가장자리에 걸치지 않게 배치)
	c = scene.textures.createCanvas('clouds', W, H);
	ctx = c.getContext('2d');
	ctx.fillStyle = 'rgba(255,255,255,0.85)';
	const P = 8;
	for (let i = 0; i < 9; i++) {
		const cx = Phaser.Math.Between(40, W - 140), cy = 80 + i * 80 + Phaser.Math.Between(-10, 10);
		const w = Phaser.Math.Between(5, 8);
		for (let k = 0; k < w; k++) ctx.fillRect(cx + k * P, cy, P, P);
		for (let k = 1; k < w - 1; k++) ctx.fillRect(cx + k * P, cy - P, P, P);
		for (let k = 2; k < w - 2; k++) ctx.fillRect(cx + k * P, cy - 2 * P, P, P);
	}
	c.refresh();
}

// 달 방패: 크고 포근한 보름달 (노란 후광 + 크레이터)
function makeShield(scene) {
	const S = 200, c = scene.textures.createCanvas('moonShield', S, S), ctx = c.getContext('2d');
	const g = ctx.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S / 2);
	g.addColorStop(0, 'rgba(255,246,190,0.55)');
	g.addColorStop(0.75, 'rgba(255,236,150,0.45)');
	g.addColorStop(1, 'rgba(255,236,150,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, S, S);
	ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 6;
	ctx.beginPath(); ctx.arc(S / 2, S / 2, 84, 0, Math.PI * 2); ctx.stroke();
	ctx.fillStyle = 'rgba(255,214,102,0.55)';
	[[70, 80, 14], [118, 66, 9], [128, 112, 16], [82, 124, 10], [100, 98, 7]].forEach(([x, y, r]) => {
		ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
	});
	c.refresh();
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
		Object.entries(SPR).forEach(([k, s]) => makeTex(this, k, s.rows, s.px, Object.assign({}, PAL, s.pal), s.shadow));
		Object.entries(VARIANTS).forEach(([k, [base, pal]]) =>
			makeTex(this, k, SPR[base].rows, SPR[base].px, Object.assign({}, PAL, SPR[base].pal, pal)));
		makeBg(this);
		makeShield(this);
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
		txt(this, W / 2, 170, 'Shot', 60, '#7a4b6b');
		const pl = this.add.image(W / 2, 290, 'player').setScale(2);
		this.tweens.add({ targets: pl, y: 275, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		// 만날 보스 미리보기: 곤충(소) - 바다 생물(중) - UFO(최종)
		['sb0', 'sb1_1', 'mb0', 'mb1', 'ub0'].forEach((k, i) => {
			const e = this.add.image(60 + i * 90, 385, k).setScale(0.6);
			this.tweens.add({ targets: e, y: 395, duration: 700 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		});
		button(this, W / 2, 470, 260, 60, tr('easy'), 0xbff0d4, () => this.start('easy'));
		button(this, W / 2, 543, 260, 60, tr('normal'), 0xfff3b0, () => this.start('normal'));
		button(this, W / 2, 616, 260, 60, tr('hard'), 0xffc2d4, () => this.start('hard'));

		// 조작 방식 선택 (◀ ▶ 로 5가지 중 고르기, 저장됨)
		txt(this, W / 2, 668, tr('control'), 16, '#9a7a8f');
		this.padLabel = txt(this, W / 2, 698, '', 24, '#7a4b6b');
		this.arrow(70, 698, -1);
		this.arrow(W - 70, 698, 1);
		this.refreshPad();

		// 언어 선택
		this.langLabel = txt(this, W / 2, 748, LANG_NAMES[LANG], 24, '#7a4b6b');
		this.arrow(70, 748, -1, true);
		this.arrow(W - 70, 748, 1, true);

		txt(this, W / 2, 782, tr('best') + ' ' + hiScore(), 16, '#7a4b6b');
		soundBtn(this, W - 30, 30);
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
				setPad(((PAD - 1 + dir + 5) % 5) + 1);
				this.refreshPad();
			}
		});
	}
	refreshPad() {
		this.padLabel.setText((PAD || 1) + '/5  ' + tr('pad')[PAD || 1]);
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
		this.score = c.score || 0; this.hp = c.hp || this.df.hp; this.power = c.power || 1; this.invuln = 0;
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
		this.player = this.physics.add.image(W / 2, PAD ? PLAYER_Y : H - 120, 'player').setDepth(5);
		this.player.setCircle(5, this.player.width / 2 - 5, this.player.height / 2 - 5);

		// UI
		this.hearts = [];
		for (let i = 0; i < this.df.hp; i++) this.hearts.push(this.add.image(24 + i * 32, 28, 'heart').setDepth(20));
		this.scoreTxt = txt(this, W - 16, 28, '0', 28).setOrigin(1, 0.5).setDepth(20);
		this.powTxt = txt(this, 16, 62, '', 18).setOrigin(0, 0.5).setDepth(20);
		this.bossBar = this.add.graphics().setDepth(20);
		this.stageTxt = txt(this, W / 2, 28, this.stage + '/' + MAX_STAGE, 20).setDepth(20);
		// 폭탄(장미) 버튼은 오른쪽 아래, 방패(달) 버튼은 왼쪽 아래 + 소리 버튼
		this.bombBtn = this.add.circle(W - 56, H - 56, 36, 0xffe3f0, 0.9).setStrokeStyle(4, 0x7a4b6b).setDepth(20).setInteractive({ useHandCursor: true });
		this.bombBtn.on('pointerdown', () => this.useBomb());
		this.add.image(W - 56, H - 62, 'rose').setDepth(21);
		this.bombTxt = txt(this, W - 56, H - 30, '', 18).setDepth(21);
		this.shieldBtn = this.add.circle(56, H - 56, 36, 0xfff6c8, 0.9).setStrokeStyle(4, 0x7a4b6b).setDepth(20).setInteractive({ useHandCursor: true });
		this.shieldBtn.on('pointerdown', () => this.useShield());
		this.add.image(56, H - 62, 'moon').setDepth(21);
		this.shieldTxt = txt(this, 56, H - 30, '', 18).setDepth(21);
		this.shieldImg = this.add.image(0, 0, 'moonShield').setDepth(6).setVisible(false);
		soundBtn(this, W - 26, 64).setDepth(20);
		this.refreshUI();

		// 입력: 드래그(터치/마우스) + 키보드
		this.cur = this.input.keyboard.createCursorKeys();
		this.wasd = this.input.keyboard.addKeys('W,A,S,D');
		this.input.addPointer(1); // 한 손가락으로 이동, 다른 손가락으로 폭탄 버튼
		this.input.on('pointerdown', (p, over) => {
			if (over.length || this.over) return; // 버튼 위에서 시작한 터치는 이동으로 쓰지 않는다
			if (PAD && p.y < PAD_Y) return; // 패드 모드: 아래 패드에서 시작한 터치만 이동
			this.dragS = { ptr: p, px: p.x, py: p.y, x: this.player.x, y: this.player.y };
			this.endTut();
		});
		this.input.on('pointerup', p => { if (this.dragS && this.dragS.ptr === p) this.dragS = null; });
		this.input.keyboard.on('keydown-SPACE', () => this.useBomb());
		this.input.keyboard.on('keydown-B', () => this.useBomb());
		this.input.keyboard.on('keydown-V', () => this.useShield());
		this.input.keyboard.on('keydown-M', () => SFX.toggle());
		if (PAD) this.setupPad();

		// 자동 연사
		this.time.addEvent({ delay: 170, loop: true, callback: () => { if (!this.over) this.fire(); } });

		// 충돌
		this.physics.add.overlap(this.pBul, this.enemies, (b, e) => this.hitEnemy(b, e));
		this.physics.add.overlap(this.player, this.eBul, (p, b) => { b.destroy(); this.hurt(); });
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
		this.powTxt.setText('★ x' + this.power);
		this.bombTxt.setText('x' + this.bombs);
		this.bombBtn.setAlpha(this.bombs > 0 ? 0.9 : 0.4);
		this.shieldTxt.setText('x' + this.shields);
		this.shieldBtn.setAlpha(this.shields > 0 ? 0.9 : 0.4);
	}
	banner(s, color) {
		const t = txt(this, W / 2, 300, s, s.length > 12 ? 34 : 44, color || '#ff6b81').setDepth(30);
		this.tweens.add({ targets: t, alpha: 0, y: 260, duration: 1600, delay: 500, onComplete: () => t.destroy() });
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
	fire() {
		SFX.shoot();
		const x = this.player.x, y = this.player.y - 30;
		const shots = this.power === 1 ? [[0, 0]] : this.power === 2 ? [[-10, 0], [10, 0]] : [[-14, -80], [0, 0], [14, 80]];
		shots.forEach(([dx, vx]) => {
			const b = this.pBul.create(x + dx, y, Math.random() < 0.5 ? 'pbullet' : 'pbullet2').setDepth(4);
			b.body.setSize(15, 15).setOffset(3, 0); // 판정은 머리 부분만 (꼬리 불꽃·그림자는 제외)
			b.body.setVelocity(vx, -620);
		});
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
		if (it.kind === 'star') { this.power = Math.min(3, this.power + 1); this.score += 200; }
		else if (it.kind === 'bomb') this.bombs = Math.min(5, this.bombs + 1);
		else if (it.kind === 'shield') this.shields = Math.min(3, this.shields + 1);
		else this.hp = Math.min(this.df.hp, this.hp + 1);
		SFX.item(it.kind);
		this.burst(it.x, it.y, 6);
		it.destroy();
		this.refreshUI();
	}

	// ----- 적 생성 -----
	// p0 -> p1(제어점) -> p2 를 따라 이동하는 곡선 이동
	moveBez(e, p0, p1, p2, dur, delay, ease, done) {
		e.tw = this.tweens.addCounter({
			from: 0, to: 1, duration: dur, delay: delay || 0, ease: ease || 'Linear',
			onStart: () => { if (e.active) { e.setVisible(true); e.body.enable = true; } },
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
		e.slotX = slot.x; e.slotY = slot.y; e.mode = 'wait';
		e.setVisible(false); e.body.enable = false;
		e.body.setSize(e.width * 0.8, e.height * 0.8, true);
		const ctrl = { x: W / 2 + (from.x < W / 2 ? -80 : 80), y: -180 };
		this.moveBez(e, from, ctrl, slot, 1600, delay, 'Sine.easeInOut', () => this.toHold(e));
		return e;
	}
	toHold(e) {
		e.mode = 'hold';
		e.nextFire = this.time.now + Phaser.Math.Between(1500, 3500) * this.df.fire;
		e.diveAt = this.time.now + Phaser.Math.Between(4000, 9000);
	}
	dive(e) {
		e.mode = 'dive';
		const p0 = { x: e.x, y: e.y };
		const p1 = { x: e.x + (e.x < W / 2 ? 170 : -170), y: e.y + 280 };
		const p2 = { x: this.player.x, y: H + 60 };
		let shot = false;
		const chk = this.time.addEvent({ delay: 100, loop: true, callback: () => {
			if (!e.active) { chk.remove(); return; }
			if (!shot && e.y > 300) { shot = true; this.aimShot(e, 170); }
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
		b.body.setCircle(6, 4, 4);
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
		if (pat === 0) {          // 한 줄(왼쪽에서 입장)
			for (let i = 0; i < 8; i++) this.spawnEnemy(s > 5 && i % 3 === 1 ? 'macaron' : 'jelly', { x: 60 + i * 51, y: 120 }, { x: -40, y: 350 }, i * 170);
		} else if (pat === 1) {   // 마카롱 한 줄(오른쪽에서 입장)
			for (let i = 0; i < 7; i++) this.spawnEnemy('macaron', { x: 80 + i * 55, y: 190 }, { x: W + 40, y: 350 }, i * 190);
		} else if (pat === 2) {   // 두 줄 섞기
			for (let i = 0; i < 5; i++) {
				this.spawnEnemy(i % 2 ? 'jelly2' : 'jelly3', { x: 80 + i * 80, y: 130 }, { x: -40, y: 200 }, i * 200);
				this.spawnEnemy('macaron', { x: 80 + i * 80, y: 250 }, { x: W + 40, y: 200 }, 100 + i * 200);
			}
		} else {                  // V자 편대
			for (let i = 0; i < 7; i++)
				this.spawnEnemy(i % 2 ? 'jelly2' : 'macaron', { x: 60 + i * 60, y: 110 + Math.abs(i - 3) * 34 }, { x: i < 4 ? -40 : W + 40, y: 300 }, i * 170);
		}
		// 뒤쪽 맵일수록 마지막 웨이브에 한 줄 추가
		if (s >= 8 && n === this.totalWaves)
			for (let i = 0; i < 5; i++) this.spawnEnemy('jelly3', { x: 80 + i * 80, y: 290 }, { x: i % 2 ? -40 : W + 40, y: 120 }, 400 + i * 160);
	}
	callBoss() {
		if (this.bossCalled || this.over) return;
		this.bossCalled = true;
		this.time.delayedCall(1200, () => this.spawnBoss());
	}

	// 보스 정의: 등급별 이름표 + 체력 + 몸 크기 + 단계별 공격 목록
	// 공격: aim(조준 부채꼴) ring(원형) spiral(나선) rain(위에서 비) curtain(구멍 뚫린 탄막 벽)
	bossDef(q) {
		const hb = this.df.boss / 60, s = this.stage;
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
			return { key, hp: Math.round((12 + s * 2) * hb), scale: 1, sx: 120, y: 150, phases: ph, w: 60, h: 50 };
		}
		if (q.tier === 'mid') {
			const ph = [
				[[R(8, 140, 2000)], [S(3, 150, 360), A(3, .25, 190, 1900)], [R(12, 150, 1500), Rn(3, 160, 800)]],
				[[A(3, .25, 190, 1400), Rn(2, 140, 900)], [A(5, .1, 230, 1100)], [R(10, 150, 1700), A(3, .3, 200, 1500)]],
				[[S(1, 150, 300)], [A(7, .09, 200, 1500)], [S(2, 170, 300), R(8, 140, 2200)]],
				[[Rn(3, 160, 700)], [R(12, 150, 1800)], [S(2, 150, 340), A(3, .3, 210, 1600)]],
				[[A(3, .3, 170, 1300)], [R(14, 140, 1800)], [S(2, 150, 350), Rn(3, 150, 800)]]
			][q.n];
			return { key: 'mb' + q.n, hp: Math.round((36 + s * 3) * hb), scale: 1, sx: 140, y: 165, phases: ph, w: 80, h: 60 };
		}
		// 최종보스 UFO (15맵은 더 크고 빠름)
		const hard = q.n === 1, f = hard ? 0.8 : 1;
		const ph = [
			[A(3, .3, 190, 1300 * f)],
			[R(12, 150, 1700 * f), A(3, .25, 200, 1700 * f)],
			[S(2, 160, 340 * f), C(130, 3000 * f)],
			[S(3, 170, 320 * f), A(5, .15, 220, 1500 * f), C(140, 2600 * f)]
		].map(a => (Array.isArray(a) ? a : [a]));
		return { key: 'ub' + q.n, hp: Math.round((hard ? 150 : 100) * hb), scale: hard ? 1.2 : 1, sx: 110, y: 175, phases: ph, w: 100, h: 55 };
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
		b.destroy();
		this.damage(e, 1);
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
		const r = Math.random();
		if (r < 0.10) this.drop(e.x, e.y, 'star');
		else if (r < 0.17 && this.hp < this.df.hp) this.drop(e.x, e.y, 'heart');
		else if (r < 0.21 && this.shields < 3) this.drop(e.x, e.y, 'shield');
		else if (r > 0.95 && this.bombs < 5) this.drop(e.x, e.y, 'bomb');
		e.destroy();
		this.refreshUI();
	}
	drop(x, y, kind) {
		const it = this.items.create(x, y, ITEM_TEX[kind]).setDepth(4);
		it.kind = kind;
		it.body.setVelocity(0, 110);
	}

	// ----- 폭탄 -----
	// 화면의 적 탄을 모두 지우고, 일반 적은 한 방에 처치, 보스에게는 8 피해. 잠깐 무적.
	useBomb() {
		if (this.over || this.time.now < this.bombCd) return;
		if (this.bombs <= 0) { SFX.empty(); return; }
		this.bombs--;
		this.bombCd = this.time.now + 700;
		this.invuln = Math.max(this.invuln, this.time.now + 1500);
		SFX.bomb();
		this.cameras.main.flash(250, 255, 225, 240);
		this.roseBloom(this.player.x, this.player.y);
		this.eBul.clear(true, true);
		this.enemies.getChildren().slice().forEach(e => {
			if (!e.active || e.mode === 'wait' || e.mode === 'boss_in') return;
			this.damage(e, e.isBoss ? 8 : 99);
		});
		this.refreshUI();
	}

	// 장미꽃이 활짝 피며 터지는 폭탄 연출: 큰 장미 + 작은 장미들이 사방으로 + 꽃잎 비
	roseBloom(x, y) {
		const big = this.add.image(x, y, 'rose').setDepth(25).setScale(1).setAlpha(0.9);
		this.tweens.add({ targets: big, scale: 24, angle: 70, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => big.destroy() });
		for (let i = 0; i < 12; i++) {
			const a = i * Math.PI / 6, r = this.add.image(x, y, 'rose').setDepth(26).setScale(1.2);
			this.tweens.add({
				targets: r, x: x + Math.cos(a) * 340, y: y + Math.sin(a) * 340, angle: 360, scale: 2.4, alpha: 0,
				duration: 800, ease: 'Cubic.easeOut', onComplete: () => r.destroy()
			});
		}
		const em = this.add.particles(x, y, 'petal', {
			speed: { min: 80, max: 420 }, lifespan: 1200, scale: { start: 1.6, end: 0.4 }, alpha: { start: 1, end: 0 },
			rotate: { min: 0, max: 360 }, gravityY: 120, tint: [0xff9fb5, 0xff6b81, 0xffc2d4], emitting: false
		}).setDepth(27);
		em.explode(60);
		this.time.delayedCall(1400, () => em.destroy());
	}

	// ----- 달 방패 -----
	// 6초 동안 커다란 보름달이 감싸 탄을 모두 막고, 닿는 적에게 피해를 준다
	useShield() {
		if (this.over || this.time.now < this.shieldUntil) return;
		if (this.shields <= 0) { SFX.empty(); return; }
		this.shields--;
		this.shieldTotal = 6000;
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
		this.shieldImg.setPosition(p.x, p.y).setScale(1 + Math.sin(time / 180) * 0.04)
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
		txt(this, W / 2, 330, tr('stageClear'), 40, '#ff6b81').setDepth(41);
		txt(this, W / 2, 400, tr('score') + ' ' + this.score, 28).setDepth(41);
		this.burst(W / 2, 300, 40);
		// 보상: 체력 +1, 3맵마다 폭탄·방패 +1
		const nx = {
			score: this.score, power: this.power,
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
		txt(this, W / 2, 250, win ? tr('allClear') : tr('gameOver'), win ? 44 : 48, win ? '#ff6b81' : '#7a4b6b').setDepth(41);
		txt(this, W / 2, 330, tr('score') + ' ' + this.score, 32).setDepth(41);
		txt(this, W / 2, 375, tr('best') + ' ' + hiScore(), 22).setDepth(41);
		button(this, W / 2, 470, 260, 64, tr('retry'), 0xfff3b0, () => this.scene.restart({ level: this.level, stage: 1 })).forEach(o => o.setDepth(41));
		button(this, W / 2, 550, 260, 64, tr('home'), 0xbff0d4, () => this.scene.start('Title')).forEach(o => o.setDepth(41));
		if (win) this.burst(W / 2, 200, 60);
	}

	// ----- 하단 터치 패드 (좌우 이동 전용) -----
	setupPad() {
		const T = [null, [0xffd6e7, 0xff9fb5], [0xd6ecff, 0x9fd8ff], [0xe6dcff, 0xb69cff], [0xd8f5e4, 0x8fdcb0], [0xfff3b0, 0xffd25a]][PAD];
		const fill = T[0], line = T[1], h = H - PAD_Y - 8;
		const g = this.add.graphics().setDepth(15);
		g.fillStyle(fill, 0.6).fillRoundedRect(8, PAD_Y, W - 16, h, 26);
		g.lineStyle(4, line, 1).strokeRoundedRect(8, PAD_Y, W - 16, h, 26);
		const cy = PAD_Y + h / 2 + 4;
		if (PAD <= 3) { // 홈(레일)
			g.lineStyle(8, line, 0.8).lineBetween(60, cy, W - 60, cy);
			g.fillStyle(line, 0.8).fillCircle(60, cy, 8).fillCircle(W - 60, cy, 8);
		}
		if (PAD === 4) { // 눈금
			g.lineStyle(3, line, 0.9);
			for (let x = 40; x <= W - 40; x += 40) g.lineBetween(x, cy - 10, x, cy + 10);
		}
		if (PAD === 3) g.lineStyle(4, line, 1).lineBetween(W / 2, cy - 16, W / 2, cy + 16);
		if (PAD === 5) { // 왼쪽/오른쪽 버튼
			g.lineStyle(4, line, 0.9).lineBetween(W / 2, PAD_Y + 14, W / 2, H - 22);
			txt(this, W / 4, cy, '◀', 44, '#7a4b6b').setDepth(16).setAlpha(0.6);
			txt(this, W * 3 / 4 - 40, cy, '▶', 44, '#7a4b6b').setDepth(16).setAlpha(0.6);
			this.hl = this.add.graphics().setDepth(15);
		}
		if (PAD === 2 || PAD === 3) this.knob = this.add.circle(W / 2, cy, 20, line, 1).setStrokeStyle(4, 0x7a4b6b).setDepth(16);
		this.padCy = cy;

		// 손가락 안내: 처음엔 좌우로 왔다갔다, 이후엔 터치를 따라다닌다
		this.finger = this.add.image(W / 2, cy, 'finger').setOrigin(0.4, 0.05).setDepth(22);
		this.tut = true;
		this.fingerTween = this.tweens.add({ targets: this.finger, x: { from: 110, to: W - 110 }, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		this.tutTxt = [txt(this, W / 2, PAD_Y - 26, tr('hint')[PAD], 20, '#7a4b6b').setDepth(22)];
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

	// 스타일별 이동 방식: 1 밀기(1:1) / 2 손가락 위치로 / 3 밀면 계속 / 4 밀기(1.8배) / 5 좌우 누르기
	padMove(ds, x) {
		const px = ds.ptr.x;
		if (PAD === 1) return x + (ds.x + px - ds.px - x) * 0.4;
		if (PAD === 2) return x + (px - x) * 0.35;
		if (PAD === 3) { const d = px - ds.px; return x + (Math.abs(d) < 8 ? 0 : Phaser.Math.Clamp(d / 60, -1, 1) * 8); }
		if (PAD === 4) return x + (ds.x + (px - ds.px) * 1.8 - x) * 0.4;
		return x + (px < W / 2 ? -7 : 7);
	}

	padUpdate() {
		const ds = this.dragS, down = !!(ds && ds.ptr.isDown);
		if (!this.tut) {
			const f = this.finger;
			if (down) { f.x = Phaser.Math.Clamp(ds.ptr.x, 16, W - 16); f.y = Phaser.Math.Clamp(ds.ptr.y, PAD_Y + 8, H - 40); }
			f.setAlpha(f.alpha + ((down ? 1 : 0) - f.alpha) * 0.3).setScale(down ? 0.9 : 1);
		}
		if (this.knob) {
			this.knob.x = PAD === 2 ? Phaser.Math.Clamp(this.player.x, 60, W - 60)
				: W / 2 + (down ? Phaser.Math.Clamp(ds.ptr.x - ds.px, -150, 150) : 0);
		}
		if (this.hl) {
			this.hl.clear().fillStyle(0xffffff, 0.45);
			if (down) this.hl.fillRoundedRect(ds.ptr.x < W / 2 ? 12 : W / 2 + 2, PAD_Y + 4, W / 2 - 14, H - PAD_Y - 16, 22);
		}
	}

	// ----- 매 프레임 -----
	update(time) {
		this.cl1.tilePositionY -= 0.6;
		this.cl2.tilePositionY -= 1.4;
		if (this.over) return;
		const p = this.player;

		// 이동: 드래그(상대 이동) 또는 키보드
		const ds = this.dragS;
		if (PAD && ds && ds.ptr.isDown) {
			p.x = this.padMove(ds, p.x);
		} else if (ds && ds.ptr.isDown) {
			p.x += (ds.x + ds.ptr.x - ds.px - p.x) * 0.4;
			p.y += (ds.y + ds.ptr.y - ds.py - p.y) * 0.4;
		} else {
			const k = this.cur, w = this.wasd;
			const vx = (k.right.isDown || w.D.isDown ? 1 : 0) - (k.left.isDown || w.A.isDown ? 1 : 0);
			const vy = (k.down.isDown || w.S.isDown ? 1 : 0) - (k.up.isDown || w.W.isDown ? 1 : 0);
			p.x += vx * 5; if (!PAD) p.y += vy * 5;
		}
		if (PAD) { p.y = PLAYER_Y; this.padUpdate(); }
		p.x = Phaser.Math.Clamp(p.x, 24, W - 24);
		p.y = Phaser.Math.Clamp(p.y, 90, H - 30);
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
