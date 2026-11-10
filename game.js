// Rosa's things - 프로토타입 (1스테이지)
// 세로 스크롤 슈팅: 갤러그식 편대 입장/급강하 + 라이덴식 자동 연사 + 보스 탄막
const W = 480, H = 800;
const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const QB = Phaser.Math.Interpolation.QuadraticBezier;
const PARAMS = new URLSearchParams(location.search); // ?boss=1 보스 바로, ?god=1 무적 (테스트용)

// 난이도: hp=하트 수, bs=적 탄속 배율, fire=적 발사 간격 배율, boss=보스 체력
const DIFF = {
	easy:   { label: '쉬움',   hp: 5, bs: 0.75, fire: 1.6, boss: 40, bomb: 3 },
	normal: { label: '보통',   hp: 3, bs: 1.0,  fire: 1.0, boss: 60, bomb: 2 },
	hard:   { label: '어려움', hp: 3, bs: 1.25, fire: 0.7, boss: 80, bomb: 2 }
};

// ---------- 도트 스프라이트 정의 ----------
const PAL = {
	o: '#7a4b6b', w: '#fff6f2', k: '#4a3050', p: '#ff9fb5', b: '#9fd8ff',
	g: '#a8ecc8', c: '#fff3b0', r: '#ff6b81', y: '#ffe066', s: '#d9c7ff', x: '#c9c3cc'
};
const SPR = {
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
	pbullet: { px: 3, rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'] },
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

function makeTex(scene, key, rows, px, pal) {
	if (scene.textures.exists(key)) return;
	const c = scene.textures.createCanvas(key, rows[0].length * px, rows.length * px);
	const ctx = c.getContext('2d');
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
		if (v === undefined) return +(localStorage.getItem('rt_hi') || 0);
		if (v > hiScore()) localStorage.setItem('rt_hi', v);
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
			else notes([784, 988, 1319], 0.06, 0.12, { type: 'triangle', vol: 0.2 });
		},
		bomb: () => {                                                                                    // 반짝반짝 쾅
			notes([523, 659, 784, 1047, 1319, 1568], 0.045, 0.18, { vol: 0.2 });
			tone(150, 0.4, { vol: 0.28, slide: 0.4, delay: 0.1 });
			sweep(0.55, 0.18);
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
		Object.entries(SPR).forEach(([k, s]) => makeTex(this, k, s.rows, s.px, PAL));
		Object.entries(VARIANTS).forEach(([k, [base, pal]]) =>
			makeTex(this, k, SPR[base].rows, SPR[base].px, Object.assign({}, PAL, pal)));
		makeBg(this);
		this.scene.start('Title');
	}
}

// ---------- 타이틀 ----------
class Title extends Phaser.Scene {
	constructor() { super('Title'); }
	create() {
		this.add.image(0, 0, 'sky').setOrigin(0);
		this.clouds = this.add.tileSprite(0, 0, W, H, 'clouds').setOrigin(0);
		txt(this, W / 2, 150, "Rosa's", 64, '#ff6b81');
		txt(this, W / 2, 220, 'things', 64, '#7a4b6b');
		const pl = this.add.image(W / 2, 340, 'player').setScale(2);
		this.tweens.add({ targets: pl, y: 325, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		['jelly', 'macaron', 'jelly2', 'jelly3'].forEach((k, i) => {
			const e = this.add.image(90 + i * 100, 430, k);
			this.tweens.add({ targets: e, y: 440, duration: 700 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
		});
		button(this, W / 2, 530, 260, 64, '쉬움', 0xbff0d4, () => this.scene.start('Game', { level: 'easy' }));
		button(this, W / 2, 610, 260, 64, '보통', 0xfff3b0, () => this.scene.start('Game', { level: 'normal' }));
		button(this, W / 2, 690, 260, 64, '어려움', 0xffc2d4, () => this.scene.start('Game', { level: 'hard' }));
		txt(this, W / 2, 755, '최고 점수 ' + hiScore(), 22, '#7a4b6b');
		soundBtn(this, W - 30, 30);
	}
	update() { this.clouds.tilePositionY -= 0.5; }
}

// ---------- 게임 ----------
class Game extends Phaser.Scene {
	constructor() { super('Game'); }
	init(d) { this.level = d.level || 'normal'; this.df = DIFF[this.level]; }

	create() {
		this.add.image(0, 0, 'sky').setOrigin(0);
		this.cl1 = this.add.tileSprite(0, 0, W, H, 'clouds').setOrigin(0).setAlpha(0.5);
		this.cl2 = this.add.tileSprite(0, 0, W, H, 'clouds').setOrigin(0);
		this.cl2.tilePositionX = 200;

		this.score = 0; this.hp = this.df.hp; this.power = 1; this.invuln = 0;
		this.bombs = this.df.bomb; this.bombCd = 0;
		this.over = false; this.boss = null; this.bossCalled = false; this.wavesSpawned = 0;
		this.god = PARAMS.has('god');

		this.pBul = this.physics.add.group();
		this.eBul = this.physics.add.group();
		this.enemies = this.physics.add.group();
		this.items = this.physics.add.group();

		// 플레이어: 판정은 중앙 작은 원(반지름 5)만
		this.player = this.physics.add.image(W / 2, H - 120, 'player').setDepth(5);
		this.player.setCircle(5, 17, 17);

		// UI
		this.hearts = [];
		for (let i = 0; i < this.df.hp; i++) this.hearts.push(this.add.image(24 + i * 32, 28, 'heart').setDepth(20));
		this.scoreTxt = txt(this, W - 16, 28, '0', 28).setOrigin(1, 0.5).setDepth(20);
		this.powTxt = txt(this, 16, 62, '', 18).setOrigin(0, 0.5).setDepth(20);
		this.bossBar = this.add.graphics().setDepth(20);
		// 폭탄 버튼 (화면 오른쪽 아래) + 소리 버튼
		this.bombBtn = this.add.circle(W - 56, H - 56, 36, 0xffe3f0, 0.9).setStrokeStyle(4, 0x7a4b6b).setDepth(20).setInteractive({ useHandCursor: true });
		this.bombBtn.on('pointerdown', () => this.useBomb());
		this.add.image(W - 56, H - 62, 'bomb').setDepth(21);
		this.bombTxt = txt(this, W - 56, H - 34, '', 18).setDepth(21);
		soundBtn(this, W - 26, 64).setDepth(20);
		this.refreshUI();

		// 입력: 드래그(터치/마우스) + 키보드
		this.cur = this.input.keyboard.createCursorKeys();
		this.wasd = this.input.keyboard.addKeys('W,A,S,D');
		this.input.addPointer(1); // 한 손가락으로 이동, 다른 손가락으로 폭탄 버튼
		this.input.on('pointerdown', (p, over) => {
			if (over.length || this.over) return; // 버튼 위에서 시작한 터치는 이동으로 쓰지 않는다
			this.dragS = { ptr: p, px: p.x, py: p.y, x: this.player.x, y: this.player.y };
		});
		this.input.on('pointerup', p => { if (this.dragS && this.dragS.ptr === p) this.dragS = null; });
		this.input.keyboard.on('keydown-SPACE', () => this.useBomb());
		this.input.keyboard.on('keydown-B', () => this.useBomb());
		this.input.keyboard.on('keydown-M', () => SFX.toggle());

		// 자동 연사
		this.time.addEvent({ delay: 170, loop: true, callback: () => { if (!this.over) this.fire(); } });

		// 충돌
		this.physics.add.overlap(this.pBul, this.enemies, (b, e) => this.hitEnemy(b, e));
		this.physics.add.overlap(this.player, this.eBul, (p, b) => { b.destroy(); this.hurt(); });
		this.physics.add.overlap(this.player, this.enemies, (p, e) => { if (e.mode !== 'wait') this.hurt(); });
		this.physics.add.overlap(this.player, this.items, (p, i) => this.collect(i));

		// 웨이브 일정 (갤러그식 곡선 입장)
		if (PARAMS.has('boss')) {
			this.wavesSpawned = 3;
			this.bossCalled = true;
			this.time.delayedCall(500, () => this.spawnBoss());
		} else {
			this.time.delayedCall(800, () => this.wave(1));
			this.time.delayedCall(7000, () => this.wave(2));
			this.time.delayedCall(14000, () => this.wave(3));
		}
		// 안전장치: 60초 지나면 남은 적이 있어도 보스 등장
		this.time.delayedCall(60000, () => this.callBoss());
	}

	// ----- UI -----
	refreshUI() {
		this.hearts.forEach((h, i) => h.setTexture(i < this.hp ? 'heart' : 'heart_e'));
		this.scoreTxt.setText(String(this.score));
		this.powTxt.setText('★ x' + this.power);
		this.bombTxt.setText('x' + this.bombs);
		this.bombBtn.setAlpha(this.bombs > 0 ? 0.9 : 0.4);
	}
	banner(s, color) {
		const t = txt(this, W / 2, 300, s, 48, color || '#ff6b81').setDepth(30);
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
		const x = this.player.x, y = this.player.y - 22;
		const shots = this.power === 1 ? [[0, 0]] : this.power === 2 ? [[-10, 0], [10, 0]] : [[-14, -80], [0, 0], [14, 80]];
		shots.forEach(([dx, vx]) => {
			const b = this.pBul.create(x + dx, y, 'pbullet').setDepth(4);
			b.body.setVelocity(vx, -620);
		});
	}
	hurt() {
		if (this.over || this.god || this.time.now < this.invuln) return;
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
		e.kind = kind; e.hp = kind === 'macaron' ? 2 : 1;
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
		this.banner('WAVE ' + n);
		SFX.wave();
		if (n === 1) {
			for (let i = 0; i < 8; i++)
				this.spawnEnemy('jelly', { x: 60 + i * 51, y: 120 }, { x: -40, y: 350 }, i * 170);
		} else if (n === 2) {
			for (let i = 0; i < 7; i++)
				this.spawnEnemy('macaron', { x: 80 + i * 55, y: 190 }, { x: W + 40, y: 350 }, i * 190);
		} else {
			for (let i = 0; i < 5; i++) {
				this.spawnEnemy(i % 2 ? 'jelly2' : 'jelly3', { x: 80 + i * 80, y: 130 }, { x: -40, y: 200 }, i * 200);
				this.spawnEnemy('macaron', { x: 80 + i * 80, y: 250 }, { x: W + 40, y: 200 }, 100 + i * 200);
			}
		}
	}
	callBoss() {
		if (this.bossCalled || this.over) return;
		this.bossCalled = true;
		this.time.delayedCall(1200, () => this.spawnBoss());
	}
	spawnBoss() {
		if (this.over) return;
		this.banner('BOSS!', '#7a4b6b');
		SFX.bossIn();
		const b = this.enemies.create(W / 2, -80, 'boss').setDepth(3);
		b.isBoss = true; b.mode = 'boss_in'; b.kind = 'boss';
		b.maxHp = b.hp = this.df.boss;
		b.body.setSize(84, 50, true);
		b.atk = 0; b.ang = 0;
		this.boss = b;
		this.tweens.add({ targets: b, y: 150, duration: 2200, ease: 'Sine.easeOut', onComplete: () => { b.mode = 'boss'; b.atk = this.time.now + 800; } });
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
		this.score += e.isBoss ? 5000 : 100;
		SFX.pop(e.isBoss);
		this.burst(e.x, e.y, e.isBoss ? 40 : 10);
		if (e.isBoss) {
			this.boss = null;
			this.eBul.clear(true, true);
			e.destroy();
			this.refreshUI();
			this.time.delayedCall(1500, () => this.end(true));
			return;
		}
		const r = Math.random();
		if (r < 0.10) this.drop(e.x, e.y, 'star');
		else if (r < 0.17 && this.hp < this.df.hp) this.drop(e.x, e.y, 'heart');
		else if (r > 0.95 && this.bombs < 5) this.drop(e.x, e.y, 'bomb');
		e.destroy();
		this.refreshUI();
	}
	drop(x, y, kind) {
		const it = this.items.create(x, y, kind).setDepth(4);
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
		this.cameras.main.flash(250, 255, 235, 248);
		const ring = this.add.circle(this.player.x, this.player.y, 20, 0xffffff, 0.35).setStrokeStyle(3, 0xff9fb5).setDepth(25);
		this.tweens.add({ targets: ring, scale: 25, alpha: 0, duration: 600, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
		this.burst(this.player.x, this.player.y, 30);
		this.eBul.clear(true, true);
		this.enemies.getChildren().slice().forEach(e => {
			if (!e.active || e.mode === 'wait' || e.mode === 'boss_in') return;
			this.damage(e, e.isBoss ? 8 : 99);
		});
		this.refreshUI();
	}

	// ----- 종료 화면 -----
	end(win) {
		if (this.over) return;
		this.over = true;
		if (win) SFX.clear(); else SFX.over();
		this.player.setVisible(false);
		hiScore(this.score);
		this.add.rectangle(0, 0, W, H, 0xffffff, 0.55).setOrigin(0).setDepth(40);
		txt(this, W / 2, 250, win ? 'CLEAR!' : 'GAME OVER', 56, win ? '#ff6b81' : '#7a4b6b').setDepth(41);
		txt(this, W / 2, 330, '점수 ' + this.score, 32).setDepth(41);
		txt(this, W / 2, 375, '최고 ' + hiScore(), 22).setDepth(41);
		button(this, W / 2, 470, 260, 64, '다시 하기', 0xfff3b0, () => this.scene.restart({ level: this.level })).forEach(o => o.setDepth(41));
		button(this, W / 2, 550, 260, 64, '처음으로', 0xbff0d4, () => this.scene.start('Title')).forEach(o => o.setDepth(41));
		if (win) this.burst(W / 2, 200, 60);
	}

	// ----- 매 프레임 -----
	update(time) {
		this.cl1.tilePositionY -= 0.6;
		this.cl2.tilePositionY -= 1.4;
		if (this.over) return;
		const p = this.player;

		// 이동: 드래그(상대 이동) 또는 키보드
		const ds = this.dragS;
		if (ds && ds.ptr.isDown) {
			p.x += (ds.x + ds.ptr.x - ds.px - p.x) * 0.4;
			p.y += (ds.y + ds.ptr.y - ds.py - p.y) * 0.4;
		} else {
			const k = this.cur, w = this.wasd;
			const vx = (k.right.isDown || w.D.isDown ? 1 : 0) - (k.left.isDown || w.A.isDown ? 1 : 0);
			const vy = (k.down.isDown || w.S.isDown ? 1 : 0) - (k.up.isDown || w.W.isDown ? 1 : 0);
			p.x += vx * 5; p.y += vy * 5;
		}
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
					e.nextFire = time + Phaser.Math.Between(2500, 5000) * this.df.fire;
				}
				if (time > e.diveAt && divers < 2 && this.wavesSpawned >= 1) { divers++; this.dive(e); }
			}
		});
		if (this.boss) this.bossUpdate(this.boss, time);

		// 화면 밖 정리
		[this.pBul, this.eBul, this.items].forEach(g => g.children.each(o => {
			if (o.active && (o.y < -30 || o.y > H + 30 || o.x < -30 || o.x > W + 30)) o.destroy();
		}));

		// 모든 웨이브 소환 후 적이 다 없어지면 보스 호출
		if (this.wavesSpawned >= 3 && !this.bossCalled && this.enemies.countActive() === 0) this.callBoss();
	}

	bossUpdate(b, time) {
		// 체력바
		this.bossBar.clear();
		this.bossBar.fillStyle(0xffffff, 0.8).fillRect(60, 52, W - 120, 12);
		this.bossBar.fillStyle(0xff6b81, 1).fillRect(62, 54, (W - 124) * (b.hp / b.maxHp), 8);
		if (b.mode !== 'boss') return;
		b.x = W / 2 + Math.sin(time / 1400) * 130;
		b.y = 150 + Math.sin(time / 700) * 10;
		if (time < b.atk) return;
		const r = b.hp / b.maxHp, f = this.df.fire;
		const aim = Phaser.Math.Angle.Between(b.x, b.y, this.player.x, this.player.y);
		if (r > 0.66) {
			// 1페이즈: 조준 3갈래
			[-0.25, 0, 0.25].forEach(d => this.eBullet(b.x, b.y + 20, aim + d, 190));
			b.atk = time + 1300 * f;
		} else if (r > 0.33) {
			// 2페이즈: 12방향 링 (매번 각도 엇갈림)
			b.ang += 0.26;
			for (let i = 0; i < 12; i++) this.eBullet(b.x, b.y + 20, b.ang + i * Math.PI / 6, 150);
			b.atk = time + 1700 * f;
		} else {
			// 3페이즈: 나선 + 가끔 조준 5갈래
			b.ang += 0.5;
			this.eBullet(b.x, b.y + 20, b.ang, 160);
			this.eBullet(b.x, b.y + 20, b.ang + Math.PI, 160);
			if (!b.fanAt || time > b.fanAt) {
				[-0.4, -0.2, 0, 0.2, 0.4].forEach(d => this.eBullet(b.x, b.y + 20, aim + d, 200));
				b.fanAt = time + 2600 * f;
			}
			b.atk = time + 320 * f;
		}
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
