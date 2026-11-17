// Rosa's Shot - 코드로 그리는 정밀 도트 (말티푸·샴고양이 영웅, 장난감 총, 우산 방패, 구름)
// 모두 1칸=1px 로 그린 뒤, 반투명 가장자리를 없애고 얇은 윤곽선을 둘러 또렷한 도트로 만든다.

// 반투명 가장자리 제거(+ 바깥 윤곽선 1px). levels 를 주면 알파를 그 단계로만 쓴다.
function crisp(ctx, w, h, o) {
	o = o || {};
	const im = ctx.getImageData(0, 0, w, h), d = im.data, lv = o.levels, thr = o.thr || 110;
	for (let i = 3; i < d.length; i += 4) {
		const a = d[i];
		if (lv) { let best = lv[0]; for (const v of lv) if (Math.abs(a - v) < Math.abs(a - best)) best = v; d[i] = best; }
		else d[i] = a >= thr ? 255 : 0;
	}
	if (o.outline) {
		const src = new Uint8ClampedArray(d), O = o.outline, k = o.mix === undefined ? 0.3 : o.mix;
		const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : (y * w + x) * 4;
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			if (src[i + 3] >= 200) continue;
			for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
				const j = at(x + dx, y + dy);
				if (j < 0 || src[j + 3] < 200) continue;
				d[i] = src[j] * k + O[0] * (1 - k); d[i + 1] = src[j + 1] * k + O[1] * (1 - k); d[i + 2] = src[j + 2] * k + O[2] * (1 - k);
				d[i + 3] = 255;
				break;
			}
		}
	}
	ctx.putImageData(im, 0, 0);
}

// 두 번 그려 입체감을 낸다: 그림자색으로 전체를 칠한 뒤, 왼쪽 위로 옮긴 밝은 색을 안쪽에만 덮는다
function fluff(ctx, pathFn, hi, sh, dx, dy) {
	ctx.save();
	pathFn(); ctx.fillStyle = sh; ctx.fill(); ctx.clip();
	ctx.translate(dx === undefined ? -1.6 : dx, dy === undefined ? -2.2 : dy);
	pathFn(); ctx.fillStyle = hi; ctx.fill();
	ctx.restore();
}
// 폭신한 털뭉치 모양: 큰 원 + 가장자리 작은 원들
function furPath(ctx, cx, cy, r, n, br, a0, a1, k) {
	return () => {
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		for (let i = 0; i < n; i++) {
			const a = a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1)), bx = cx + Math.cos(a) * r * (k || 0.9), by = cy + Math.sin(a) * r * (k || 0.9);
			ctx.moveTo(bx + br, by); ctx.arc(bx, by, br, 0, Math.PI * 2);
		}
	};
}
function ell(ctx, x, y, rx, ry, fill, rot, stroke, lw) {
	ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
	if (fill) { ctx.fillStyle = fill; ctx.fill(); }
	if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

// 영웅 2종(말티푸·샴고양이): 망토 없이 두 앞발로 장난감 총을 잡고, 꼬리를 살랑거리며 쏜다. 방패는 우산
// (이 코드는 art_v2 미리보기에서 확정한 그림과 같다)
// 감은 눈: pose.happy 면 두 눈 모두 ^ ^, pose.wink 면 오른쪽 눈만 윙크
function closedEye(ctx, pose, x, i) {
	if (!pose || !(pose.happy || (pose.wink && i === 1))) return false;
	ctx.strokeStyle = '#3a2640'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
	ctx.beginPath(); ctx.arc(x, 27.4, 3, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
	ctx.lineCap = 'butt';
	return true;
}
function drawGun(ctx, paw, pose) {
	pose = pose || {};
	ctx.save();
	ctx.translate(44, 55); ctx.rotate(pose.aim || 0); ctx.translate(-44, -55 + (pose.kick || 0));
	if (pose.hold) { // 우산을 들 때: 총은 없고 앞발만 가슴 앞에 모은다 (막대는 뒤쪽 오버레이)
	} else {
		ctx.save(); ctx.translate(45, 53); ctx.rotate(0.3);
		ctx.fillStyle = '#ff7aa2'; ctx.beginPath(); ctx.roundRect(-2.6, -1, 5.2, 8, 1.6); ctx.fill();
		ctx.restore();
		const body = ctx.createLinearGradient(40, 0, 49, 0); body.addColorStop(0, '#bfe9ff'); body.addColorStop(0.55, '#7fcdf6'); body.addColorStop(1, '#4fa6e0');
		ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(40.2, 40.5, 7.8, 13, 2.2); ctx.fill();
		ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.roundRect(39.6, 37.2, 9, 4.2, 1.6); ctx.fill();
		ell(ctx, 44.1, 37.9, 2.7, 1.1, '#6a2d4a');
		ctx.fillStyle = '#ff7aa2'; ctx.fillRect(40.2, 45.6, 7.8, 1.4);
		ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(43.2, 42.8, 1, 0, Math.PI * 2); ctx.arc(45, 42.8, 1, 0, Math.PI * 2); ctx.moveTo(42.3, 43.2); ctx.lineTo(44.1, 45.4); ctx.lineTo(45.9, 43.2); ctx.fill();
	}
	// 두 앞발로 꼭 잡는다
	if (pose.hold) { ell(ctx, 28.4, 49, 3.4, 2.9, paw); ell(ctx, 35.6, 49, 3.4, 2.9, paw); }
	else { ell(ctx, 43.6, 47.2, 3.4, 2.9, paw); ell(ctx, 43.2, 52.4, 3.4, 2.9, paw); }
	if (pose.flash && !pose.hold) {
		const r = 3.5 + 4.5 * pose.flash;
		ctx.fillStyle = '#ffd24d'; ctx.beginPath();
		for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? r * 0.45 : r; ctx.lineTo(44.1 + Math.cos(a) * rr, 32.4 + Math.sin(a) * rr); }
		ctx.closePath(); ctx.fill();
		ell(ctx, 44.1, 32.4, r * 0.42, r * 0.42, '#fffbe0');
		ell(ctx, 44.1 + r * 0.9, 29.4 - r * 0.4, 1.2, 1.2, '#ff8fb0'); ell(ctx, 44.1 - r * 0.9, 28.4 - r * 0.3, 1, 1, '#9fd8ff');
	}
	ctx.restore();
}

function collar2(ctx) {
	ctx.strokeStyle = '#ff6b81'; ctx.lineWidth = 2.2;
	ctx.beginPath(); ctx.ellipse(32, 36.4, 9.4, 3.6, 0, 0.18, Math.PI - 0.18); ctx.stroke();
	ell(ctx, 32, 40.2, 2.6, 2.6, '#ffd24d', 0, '#c98a12', 0.8); ell(ctx, 31.2, 39.4, 0.8, 0.8, '#fff6c8');
}

function drawDog(ctx, pose) {
	pose = pose || {};
	const FUR = '#fffdfa', FURS = '#e7dbe6', EAR = '#fbf1e4', EARS = '#e6d3c8', LINE = '#a98aa6';
	if (pose.dy) ctx.translate(0, pose.dy);
	// 꼬리: 뒤쪽 오른편의 동그란 털뭉치, 살랑살랑
	ctx.save(); ctx.translate(43, 56); ctx.rotate(pose.tail || 0); ctx.translate(-43, -56);
	fluff(ctx, furPath(ctx, 51.5, 49, 5.2, 6, 2.4, 0, Math.PI * 2, 1), FUR, FURS);
	ctx.restore();
	// 뒷발
	[23.6, 40.4].forEach(x => { ell(ctx, x, 59, 5.2, 3.3, FUR, 0, LINE, 0.9); ell(ctx, x, 60.2, 1.5, 1, '#ffb3c6'); });
	// 몸통
	fluff(ctx, furPath(ctx, 32, 47, 11, 8, 3.4, 0.1, Math.PI - 0.1, 0.92), FUR, FURS);
	// 팔: 왼팔은 가슴을 가로질러 총으로, 오른팔은 곧게 총으로
	ell(ctx, 33, 47.6, 9.6, 2.9, FUR, 0.5); ell(ctx, 40.4, 44.4, 5.6, 2.8, FUR, 1.0);
	// 귀
	[-1, 1].forEach(sd => {
		const ex = 32 + sd * 15.5;
		fluff(ctx, furPath(ctx, ex, 31, 7.2, 6, 2.6, sd < 0 ? 1.5 : -0.1, sd < 0 ? 3.2 : 1.7, 1.15), EAR, EARS, sd * 1.2, -2);
	});
	// 머리, 정수리 묶음 + 리본
	fluff(ctx, furPath(ctx, 32, 24, 14, 14, 4.4, Math.PI * 0.95, Math.PI * 2.05, 0.93), FUR, FURS);
	fluff(ctx, furPath(ctx, 33, 7.5, 4.6, 5, 2.2, Math.PI, Math.PI * 2, 1), FUR, FURS, -1, -1.4);
	ctx.fillStyle = '#ff6b81';
	ctx.beginPath(); ctx.moveTo(33, 11); ctx.lineTo(26.5, 8); ctx.lineTo(27, 13.8); ctx.closePath(); ctx.fill();
	ctx.beginPath(); ctx.moveTo(33, 11); ctx.lineTo(39.5, 8); ctx.lineTo(39, 13.8); ctx.closePath(); ctx.fill();
	ell(ctx, 33, 11, 1.9, 1.9, '#ff3d63');
	// 얼굴
	ell(ctx, 21.2, 30.6, 3.3, 2.1, 'rgba(255,150,175,0.65)'); ell(ctx, 42.8, 30.6, 3.3, 2.1, 'rgba(255,150,175,0.65)');
	[25.5, 38.5].forEach((x, i) => {
		if (closedEye(ctx, pose, x, i)) return;
		ell(ctx, x, 25.3, 3.1, 3.7, '#3a2640');
		ell(ctx, x - 1, 23.9, 1.2, 1.4, '#ffffff'); ell(ctx, x + 1.1, 27, 0.7, 0.7, '#ffffff');
	});
	ell(ctx, 32, 31, 3.2, 2.3, '#2b1d33'); ell(ctx, 31, 30.2, 1, 0.7, '#ffffff');
	ctx.strokeStyle = '#3a2640'; ctx.lineWidth = 1;
	if (pose.mouth) { ell(ctx, 32, 36, 3.3, 3, '#7d2f52'); ell(ctx, 32, 37.4, 2.1, 1.5, '#ff8fb0'); }
	else {
		ctx.beginPath(); ctx.moveTo(32, 32.6); ctx.lineTo(32, 34.3); ctx.stroke();
		ctx.beginPath(); ctx.arc(29.9, 34.3, 2.1, 0, Math.PI); ctx.stroke();
		ctx.beginPath(); ctx.arc(34.1, 34.3, 2.1, 0, Math.PI); ctx.stroke();
		ell(ctx, 32, 37.2, 1.7, 1.6, '#ff8fb0');
	}
	collar2(ctx);
	drawGun(ctx, FUR, pose);
}

function drawCat(ctx, pose) {
	pose = pose || {};
	const CR = '#f7ecdb', CRS = '#dcc6aa', DK = '#5a403a', DKS = '#3f2b27', DKH = '#76564d';
	if (pose.dy) ctx.translate(0, pose.dy);
	// 꼬리: 길고 갈색, 끝이 말려 올라가며 살랑살랑
	ctx.save(); ctx.translate(44, 57); ctx.rotate(pose.tail || 0); ctx.translate(-44, -57);
	ctx.lineCap = 'round';
	ctx.strokeStyle = DKS; ctx.lineWidth = 5.8; ctx.beginPath(); ctx.moveTo(44, 57); ctx.bezierCurveTo(58, 62, 64, 48, 57, 37); ctx.stroke();
	ctx.strokeStyle = DK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(44, 57); ctx.bezierCurveTo(58, 62, 64, 48, 57, 37); ctx.stroke();
	ctx.lineCap = 'butt';
	ctx.restore();
	// 뒷발(갈색 양말)
	[23.6, 40.4].forEach(x => { ell(ctx, x, 59, 5, 3.2, DK); ell(ctx, x, 60.3, 1.4, 0.9, '#e8a9a6'); });
	// 몸통
	fluff(ctx, () => { ctx.beginPath(); ctx.ellipse(32, 47, 10.8, 11, 0, 0, Math.PI * 2); }, CR, CRS);
	// 팔
	ell(ctx, 33, 47.6, 9.6, 2.9, CR, 0.5); ell(ctx, 40.4, 44.4, 5.6, 2.8, CR, 1.0);
	// 귀
	[-1, 1].forEach(sd => {
		const X = x => 32 + sd * x;
		ctx.fillStyle = DK; ctx.beginPath(); ctx.moveTo(X(4.5), 14); ctx.lineTo(X(14.5), 0.8); ctx.lineTo(X(18.5), 22); ctx.closePath(); ctx.fill();
		ctx.fillStyle = DKH; ctx.beginPath(); ctx.moveTo(X(7), 13); ctx.lineTo(X(14.3), 3.6); ctx.lineTo(X(16.6), 17); ctx.closePath(); ctx.fill();
		ctx.fillStyle = '#e9a7a5'; ctx.beginPath(); ctx.moveTo(X(9.2), 13.4); ctx.lineTo(X(14.1), 6.6); ctx.lineTo(X(15.4), 16); ctx.closePath(); ctx.fill();
	});
	// 머리 + 마스크
	fluff(ctx, () => {
		ctx.beginPath(); ctx.ellipse(32, 25, 15.6, 13.2, 0, 0, Math.PI * 2);
		ctx.moveTo(17.5, 30); ctx.arc(16.5, 30, 3.2, 0, Math.PI * 2); ctx.moveTo(50.5, 30); ctx.arc(47.5, 30, 3.2, 0, Math.PI * 2);
	}, '#fbf3e6', CRS, -1.2, -1.8);
	ctx.fillStyle = DK;
	ctx.beginPath(); ctx.ellipse(32, 28.5, 11.6, 8.4, 0, 0, Math.PI * 2); ctx.fill();
	ctx.beginPath(); ctx.moveTo(32, 14.4); ctx.quadraticCurveTo(28.6, 20, 22.5, 25.5); ctx.lineTo(41.5, 25.5); ctx.quadraticCurveTo(35.4, 20, 32, 14.4); ctx.fill();
	ell(ctx, 29.6, 20, 1.9, 4.2, DKH, 0.2);
	[25.5, 38.5].forEach((x, i) => {
		if (closedEye(ctx, pose, x, i)) return;
		const g = ctx.createRadialGradient(x - 1, 24, 0.5, x, 25.3, 4.6); g.addColorStop(0, '#e4f3ff'); g.addColorStop(0.55, '#7fbcff'); g.addColorStop(1, '#3f82d6');
		ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, 25.3, 4.2, 4.1, 0, 0, Math.PI * 2); ctx.fill();
		ell(ctx, x + 0.1, 25.6, 1.5, 3.2, '#201634');
		ell(ctx, x - 1.3, 23.7, 1.3, 1.4, '#ffffff'); ell(ctx, x + 1.4, 27.2, 0.7, 0.7, '#ffffff');
	});
	ell(ctx, 21, 32.4, 2.8, 1.7, 'rgba(255,150,170,0.7)'); ell(ctx, 43, 32.4, 2.8, 1.7, 'rgba(255,150,170,0.7)');
	ctx.fillStyle = '#e59a9c'; ctx.beginPath(); ctx.moveTo(29.8, 30.2); ctx.lineTo(34.2, 30.2); ctx.lineTo(32, 32.6); ctx.closePath(); ctx.fill();
	ctx.strokeStyle = '#2a1c24'; ctx.lineWidth = 0.9;
	if (pose.mouth) { ell(ctx, 32, 36.4, 3.2, 3, '#7d2f52'); ell(ctx, 32, 37.8, 2.1, 1.5, '#ff8fa5'); }
	else {
		ctx.beginPath(); ctx.moveTo(32, 32.6); ctx.lineTo(32, 33.8); ctx.stroke();
		ctx.beginPath(); ctx.arc(30, 33.8, 2, 0.1, Math.PI - 0.3); ctx.stroke();
		ctx.beginPath(); ctx.arc(34, 33.8, 2, 0.3, Math.PI - 0.1); ctx.stroke();
	}
	// 왼쪽 귀 옆 빨간 리본
	ctx.fillStyle = '#ff6b81';
	ctx.beginPath(); ctx.moveTo(22, 11.5); ctx.lineTo(15.5, 8.6); ctx.lineTo(15.8, 14.6); ctx.closePath(); ctx.fill();
	ctx.beginPath(); ctx.moveTo(22, 11.5); ctx.lineTo(27.4, 7.6); ctx.lineTo(27.6, 13.6); ctx.closePath(); ctx.fill();
	ell(ctx, 22, 11.5, 1.8, 1.8, '#ff3d63');
	collar2(ctx);
	drawGun(ctx, DK, pose);
}

// 우산 지붕: 허브(막대 끝)를 (0,0)으로 위쪽으로 펼쳐진다. rx 가 펼친 정도
function canopy2(ctx, rx, ry) {
	const n = 6;
	for (let i = 0; i < n; i++) {
		const x0 = -rx + 2 * rx * i / n, x1 = -rx + 2 * rx * (i + 1) / n;
		ctx.beginPath(); ctx.moveTo(0, -ry);
		ctx.quadraticCurveTo(x0 * 1.06, -ry * 0.72, x0, 0);
		ctx.quadraticCurveTo((x0 + x1) / 2, rx > 12 ? 5 : 1, x1, 0);
		ctx.quadraticCurveTo(x1 * 1.06, -ry * 0.72, 0, -ry);
		ctx.fillStyle = i % 2 ? '#fff4f6' : '#ff8fb0'; ctx.fill();
		ctx.strokeStyle = '#c94a74'; ctx.lineWidth = 0.8; ctx.stroke();
	}
	ell(ctx, 0, -ry - 1, 1.7, 2.3, '#ffd24d');
	if (rx > 14) ell(ctx, -rx * 0.42, -ry * 0.62, rx * 0.17, ry * 0.1, 'rgba(255,255,255,0.65)', -0.5);
}

// 포즈별 그림 이름: '' 대기, a/b 꼬리 좌우, aim 조준, fire 발사, rec 반동 회복, o 폭탄 뱉기, p 우산 들기
const CHAR_POSES = {
	'': { tail: 0 }, a: { tail: -0.32 }, b: { tail: 0.32 },
	aim: { aim: -0.1, mouth: 1, tail: 0.2 },
	fire: { aim: -0.26, kick: 1.8, flash: 1, wink: 1, mouth: 1, dy: 1.2, tail: -0.3 },
	rec: { aim: -0.18, kick: 0.6, flash: 0.4, happy: 1, mouth: 1, dy: 0.5, tail: 0.3 },
	o: { mouth: 1, tail: 0.1 },
	p: { hold: 1, tail: 0.15 }
};
function charTex(scene, key, S, fn, pose) {
	if (scene.textures.exists(key)) return;
	const N = 64 * S, c = scene.textures.createCanvas(key, N, N), ctx = c.getContext('2d');
	ctx.scale(S, S);
	fn(ctx, pose);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	crisp(ctx, N, N, { outline: [74, 40, 78], mix: 0.28 });
	c.refresh();
}
function makeCharSet(scene, k, fn) {
	Object.entries(CHAR_POSES).forEach(([suf, pose]) => charTex(scene, suf ? k + '_' + suf : k, 1, fn, pose));
	[['_big', 0], ['_bigA', -0.32], ['_bigB', 0.32]].forEach(([suf, tail]) => charTex(scene, k + suf, 2, fn, { tail })); // 타이틀용 2배 해상도
}

// 우산 방패 오버레이(128x112): 캐릭터 뒤에서 막대와 지붕이 펼쳐진다. 캐릭터 중심은 (64, 80)
function makeUmbrellaOverlay(scene) {
	[0.1, 0.4, 0.75, 1].forEach((open, i) => {
		const key = 'um' + i;
		if (scene.textures.exists(key)) return;
		const CW = 128, CH = 112, lay = document.createElement('canvas');
		lay.width = CW; lay.height = CH;
		const c = lay.getContext('2d');
		c.strokeStyle = '#7a4b6b'; c.lineWidth = 2.2; c.lineCap = 'round';
		c.beginPath(); c.moveTo(64, 105); c.lineTo(64, 45); c.stroke();
		c.beginPath(); c.arc(61.2, 105, 2.8, 0, Math.PI); c.stroke();
		c.save(); c.translate(64, 45); canopy2(c, 6 + 38 * open, 30); c.restore();
		crisp(c, CW, CH, { outline: [74, 40, 78], mix: 0.28 });
		const t = scene.textures.createCanvas(key, CW, CH), ctx = t.getContext('2d');
		if (open > 0.5) { // 보호막 빛
			const g = ctx.createRadialGradient(64, 62, 20, 64, 62, 58);
			g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(159,216,255,0.35)'); g.addColorStop(1, 'rgba(159,216,255,0)');
			ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
		}
		ctx.drawImage(lay, 0, 0);
		t.refresh();
	});
}

// 구름: 동그란 뭉치를 겹쳐 그리고 아래쪽에 옅은 그림자 (세로로 이어 붙는 스크롤용)
function makeClouds(scene) {
	const c = scene.textures.createCanvas('clouds', W, H), ctx = c.getContext('2d');
	for (let i = 0; i < Math.ceil(H / 80) + 1; i++) {
		const cx = Phaser.Math.Between(80, W - 130), cy = 70 + i * 80 + Phaser.Math.Between(-8, 8), n = Phaser.Math.Between(4, 6);
		const blobs = [];
		for (let k = 0; k < n; k++) blobs.push([cx + k * 15 - n * 7, cy - Math.sin(k / (n - 1) * Math.PI) * 9 + Phaser.Math.Between(-2, 2), 11 + Math.sin(k / (n - 1) * Math.PI) * 7]);
		const path = () => { ctx.beginPath(); blobs.forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }); };
		fluff(ctx, path, '#ffffff', '#dfe8f7', 0, -3.5);
	}
	crisp(ctx, W, H, { levels: [0, 217] });
	c.refresh();
}

// 장미 폭탄: 분홍 둥근 폭탄에 귀여운 얼굴, 심지 끝에 불꽃
function makeBomb(scene) {
	const W2 = 44, H2 = 48, c = scene.textures.createCanvas('bomb', W2, H2), ctx = c.getContext('2d');
	const g = ctx.createRadialGradient(17, 24, 2, 22, 28, 17);
	g.addColorStop(0, '#ffc7d8'); g.addColorStop(0.55, '#ff86a3'); g.addColorStop(1, '#d94672');
	ctx.fillStyle = g; ctx.beginPath(); ctx.arc(22, 28, 16, 0, Math.PI * 2); ctx.fill();
	ctx.strokeStyle = 'rgba(255,214,226,0.9)'; ctx.lineWidth = 1.3; // 장미 꽃잎 소용돌이
	ctx.beginPath(); ctx.arc(22, 28, 12, 3.6, 5.6); ctx.stroke();
	ctx.beginPath(); ctx.arc(22, 28, 8, 0.4, 2.6); ctx.stroke();
	ell(ctx, 15.5, 21, 3.4, 2, 'rgba(255,255,255,0.85)', -0.7);
	ctx.fillStyle = '#6e4264'; ctx.beginPath(); ctx.roundRect(17, 9.5, 10, 5.5, 2); ctx.fill();
	ctx.strokeStyle = '#6e4264'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(23, 10); ctx.quadraticCurveTo(24, 5, 30, 4); ctx.stroke();
	ctx.fillStyle = '#ffe066'; ctx.beginPath();
	for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.8 : 4.2, a = i * Math.PI / 4; ctx.lineTo(31 + Math.cos(a) * r, 4 + Math.sin(a) * r); }
	ctx.closePath(); ctx.fill();
	ell(ctx, 31, 4, 1.2, 1.2, '#fff');
	ell(ctx, 16.5, 30, 1.7, 2.1, '#3a2640'); ell(ctx, 27.5, 30, 1.7, 2.1, '#3a2640');   // 눈
	ell(ctx, 13, 33.5, 2.4, 1.5, 'rgba(255,255,255,0.45)'); ell(ctx, 31, 33.5, 2.4, 1.5, 'rgba(255,255,255,0.45)'); // 볼
	ctx.strokeStyle = '#3a2640'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(22, 32.5, 2, 0.2, Math.PI - 0.2); ctx.stroke();
	crisp(ctx, W2, H2, { outline: [96, 28, 66], mix: 0.3 });
	c.refresh();
}

// 꽃 아이템 4종 (48x48): 벚꽃(체력) 해바라기(강화) 장미(폭탄) 달맞이꽃(망토 방패)
function makeFlowers(scene) {
	const S = 48, mk = (key, fn) => {
		const c = scene.textures.createCanvas(key, S, S), ctx = c.getContext('2d');
		fn(ctx);
		crisp(ctx, S, S, { outline: [100, 44, 84], mix: 0.3 });
		c.refresh();
	};
	const petals = (ctx, n, dist, rx, ry, fill, edge, rot) => {
		for (let i = 0; i < n; i++) {
			const a = (rot || -Math.PI / 2) + i * Math.PI * 2 / n;
			ctx.save(); ctx.translate(24 + Math.cos(a) * dist, 24 + Math.sin(a) * dist); ctx.rotate(a + Math.PI / 2);
			ell(ctx, 0, 0, rx, ry, fill, 0, edge, 1);
			ell(ctx, -rx * 0.25, -ry * 0.25, rx * 0.35, ry * 0.45, 'rgba(255,255,255,0.45)');
			ctx.restore();
		}
	};
	mk('sakura', ctx => {
		petals(ctx, 5, 10.5, 8, 10.5, '#ffbfd3', '#ff8fb0');
		ell(ctx, 24, 24, 5, 5, '#ffe066');
		for (let i = 0; i < 6; i++) ell(ctx, 24 + Math.cos(i * 1.047) * 3.2, 24 + Math.sin(i * 1.047) * 3.2, 1.1, 1.1, '#ff6b81');
	});
	mk('sunflower', ctx => {
		petals(ctx, 14, 15.5, 3.6, 8, '#ffd43b', '#e8a600');
		petals(ctx, 14, 13, 3.2, 6.5, '#ffe36e', '#f0b400', -Math.PI / 2 + 0.22);
		const g = ctx.createRadialGradient(22, 22, 1, 24, 24, 10); g.addColorStop(0, '#b97434'); g.addColorStop(1, '#5a3414');
		ctx.fillStyle = g; ctx.beginPath(); ctx.arc(24, 24, 9.5, 0, Math.PI * 2); ctx.fill();
		ctx.fillStyle = '#d99a56'; for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 1 + i * 0.95; ctx.fillRect(24 + Math.cos(a) * r - 0.5, 24 + Math.sin(a) * r - 0.5, 1.4, 1.4); }
	});
	mk('rose', ctx => {
		ell(ctx, 14, 40, 7, 3.2, '#5fd08a', -0.5, '#3a9b62', 0.9); ell(ctx, 34, 40, 7, 3.2, '#5fd08a', 0.5, '#3a9b62', 0.9);
		const g = ctx.createRadialGradient(20, 19, 2, 24, 24, 17); g.addColorStop(0, '#ff8aa0'); g.addColorStop(1, '#e03a5f');
		ctx.fillStyle = g; ctx.beginPath(); ctx.arc(24, 24, 16.5, 0, Math.PI * 2); ctx.fill();
		ctx.strokeStyle = '#a3103a'; ctx.lineWidth = 1.5;
		ctx.beginPath(); ctx.arc(24, 24, 12.5, 3.2, 6.0); ctx.stroke();
		ctx.beginPath(); ctx.arc(24.5, 24, 8.5, 0.2, 3.4); ctx.stroke();
		ctx.beginPath(); ctx.arc(23.5, 24.5, 4.6, 3.6, 6.8); ctx.stroke();
		ell(ctx, 17.5, 17.5, 3.6, 2.2, 'rgba(255,255,255,0.55)', -0.7);
	});
	mk('moonflower', ctx => {
		petals(ctx, 6, 11, 7.2, 10, '#fff8f2', '#9fd0f0');
		const g = ctx.createRadialGradient(24, 24, 1, 24, 24, 9); g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#bfe3ff');
		ctx.fillStyle = g; ctx.beginPath(); ctx.arc(24, 24, 8, 0, Math.PI * 2); ctx.fill();
		ell(ctx, 24, 24, 3.6, 3.6, '#ffe066');
	});
}

// 폭탄이 터질 때 퍼지는 분홍 파동 (고리 모양 그라데이션)
function makeShock(scene) {
	const S = 256, c = scene.textures.createCanvas('shock', S, S), ctx = c.getContext('2d');
	const g = ctx.createRadialGradient(S / 2, S / 2, 70, S / 2, S / 2, S / 2);
	g.addColorStop(0, 'rgba(255,194,212,0)'); g.addColorStop(0.7, 'rgba(255,194,212,0.35)'); g.addColorStop(0.9, 'rgba(255,107,129,0.85)'); g.addColorStop(1, 'rgba(255,107,129,0)');
	ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
	c.refresh();
}

// ---------- 무기 탄 / 아이템 (2026-11-17) ----------
// 적 탄: 지름 9px 의 작은 구슬 (예전의 절반 굵기)
function makeEnemyBullet(scene) {
	const S = 11, c = scene.textures.createCanvas('ebullet', S, S), ctx = c.getContext('2d');
	const g = ctx.createRadialGradient(4.2, 4.2, 0.3, 5.5, 5.5, 4.4); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ffb3c8'); g.addColorStop(1, '#ff6b8f');
	ctx.fillStyle = g; ctx.beginPath(); ctx.arc(5.5, 5.5, 4, 0, Math.PI * 2); ctx.fill();
	crisp(ctx, S, S, { outline: [122, 40, 84], mix: 0.25 });
	c.refresh();
}

// 내 무기 탄 3종: 노란 총알(국화), 분홍 레이저(벚꽃, 기존 pbullet), 빨간 유도탄(빨간 꽃)
function makeWeaponShots(scene) {
	let c = scene.textures.createCanvas('pbul', 9, 13), ctx = c.getContext('2d');
	let g = ctx.createLinearGradient(0, 0, 0, 13); g.addColorStop(0, '#fff7c2'); g.addColorStop(1, '#ffc42e');
	ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(4.5, 6.5, 3.1, 5, 0, 0, Math.PI * 2); ctx.fill();
	ell(ctx, 3.8, 4.5, 0.9, 1.7, '#ffffff');
	crisp(ctx, 9, 13, { outline: [176, 98, 10], mix: 0.35 });
	c.refresh();
	// 유도탄: 위를 향한 작은 로켓 (뾰족한 머리, 날개, 아래 불꽃)
	c = scene.textures.createCanvas('pmis', 14, 24); ctx = c.getContext('2d');
	ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.moveTo(7, 20); ctx.lineTo(4.4, 24); ctx.lineTo(7, 22.6); ctx.lineTo(9.6, 24); ctx.closePath(); ctx.fill();
	ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.moveTo(7, 19); ctx.lineTo(5.6, 22); ctx.lineTo(8.4, 22); ctx.closePath(); ctx.fill();
	ctx.fillStyle = '#d9344f'; ctx.beginPath(); ctx.moveTo(4, 17); ctx.lineTo(0.6, 20); ctx.lineTo(4, 14); ctx.closePath(); ctx.fill();
	ctx.beginPath(); ctx.moveTo(10, 17); ctx.lineTo(13.4, 20); ctx.lineTo(10, 14); ctx.closePath(); ctx.fill();
	g = ctx.createLinearGradient(3, 0, 11, 0); g.addColorStop(0, '#ff8a9e'); g.addColorStop(0.5, '#ffd3dc'); g.addColorStop(1, '#ee4d6c');
	ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(7, 0.5); ctx.quadraticCurveTo(11.4, 5, 10.6, 18); ctx.lineTo(3.4, 18); ctx.quadraticCurveTo(2.6, 5, 7, 0.5); ctx.fill();
	ell(ctx, 7, 11, 1.8, 1.8, '#9fd8ff', 0, '#5a8fbf', 0.5);
	crisp(ctx, 14, 24, { outline: [120, 24, 56], mix: 0.3 });
	c.refresh();
}

// 꽃 3종(국화·벚꽃·빨간꽃) + 우산 + 폭탄 + 하트 아이템 (48x48)
function makeItems(scene) {
	const S = 48, mk = (key, fn) => {
		const c = scene.textures.createCanvas(key, S, S), ctx = c.getContext('2d');
		fn(ctx);
		crisp(ctx, S, S, { outline: [100, 44, 84], mix: 0.3 });
		c.refresh();
	};
	const ring = (ctx, n, dist, rx, ry, fill, edge, rot) => {
		for (let i = 0; i < n; i++) {
			const a = (rot || -Math.PI / 2) + i * Math.PI * 2 / n;
			ctx.save(); ctx.translate(24 + Math.cos(a) * dist, 24 + Math.sin(a) * dist); ctx.rotate(a + Math.PI / 2);
			ell(ctx, 0, 0, rx, ry, fill, 0, edge, 0.8);
			ctx.restore();
		}
	};
	// 노란 국화: 가는 꽃잎을 3겹으로 촘촘히
	mk('chrys', ctx => {
		ring(ctx, 16, 15, 2.5, 8.2, '#ffc928', '#d99a00');
		ring(ctx, 14, 11.5, 2.5, 7, '#ffdc4d', '#e8ad00', -Math.PI / 2 + 0.2);
		ring(ctx, 10, 8, 2.4, 5.4, '#fff08a', '#f0c000', -Math.PI / 2 + 0.1);
		ell(ctx, 24, 24, 4.3, 4.3, '#ffa91f'); ell(ctx, 23, 23, 1.6, 1.6, '#fff3b0');
	});
	// 빨간 꽃(양귀비): 넓은 꽃잎 5장 + 검은 속
	mk('redflower', ctx => {
		for (let i = 0; i < 5; i++) {
			const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
			ctx.save(); ctx.translate(24 + Math.cos(a) * 10, 24 + Math.sin(a) * 10); ctx.rotate(a + Math.PI / 2);
			const g = ctx.createRadialGradient(0, 3, 1, 0, 0, 12); g.addColorStop(0, '#c71f3c'); g.addColorStop(1, '#ff5c70');
			ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 9.4, 11.4, 0, 0, Math.PI * 2); ctx.fill();
			ctx.strokeStyle = 'rgba(130,10,40,0.45)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -4); ctx.stroke();
			ell(ctx, -3, -5, 2.6, 1.6, 'rgba(255,255,255,0.4)', -0.5);
			ctx.restore();
		}
		ell(ctx, 24, 24, 5.6, 5.6, '#3a1830');
		for (let i = 0; i < 8; i++) ell(ctx, 24 + Math.cos(i * 0.785) * 7.2, 24 + Math.sin(i * 0.785) * 7.2, 0.9, 0.9, '#2a1020');
		ell(ctx, 22.8, 22.8, 1.5, 1.5, 'rgba(255,255,255,0.55)');
	});
	// 우산: 분홍·하양 줄무늬 둥근 지붕 + 손잡이
	mk('umbrella', ctx => {
		const R = 19, cx = 24, cy = 24;
		ctx.strokeStyle = '#7a4b6b'; ctx.lineWidth = 2; ctx.lineCap = 'round';
		ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx, 40); ctx.arc(cx - 3.2, 40, 3.2, 0, Math.PI * 0.95); ctx.stroke();
		ctx.lineCap = 'butt';
		const segs = 5;
		for (let i = 0; i < segs; i++) {
			const x0 = cx - R + (2 * R) * i / segs, x1 = cx - R + (2 * R) * (i + 1) / segs;
			ctx.beginPath(); ctx.moveTo(cx, cy - 18);
			ctx.quadraticCurveTo(x0 - 1, cy - 12, x0, cy + 4);
			ctx.quadraticCurveTo((x0 + x1) / 2, cy - 3, x1, cy + 4);
			ctx.quadraticCurveTo(x1 + 1, cy - 12, cx, cy - 18);
			ctx.fillStyle = i % 2 ? '#fff4f6' : '#ff8fb0'; ctx.fill();
		}
		ctx.beginPath(); ctx.ellipse(cx, cy - 8, R, 14, 0, Math.PI, Math.PI * 2); ctx.strokeStyle = '#c94a74'; ctx.lineWidth = 1.2; ctx.stroke();
		ell(ctx, cx, cy - 19, 1.8, 1.8, '#ffd24d');
		ell(ctx, cx - 8, cy - 10, 4, 2, 'rgba(255,255,255,0.55)', -0.6);
	});
	// 하트(체력)
	mk('heartItem', ctx => {
		const g = ctx.createRadialGradient(19, 17, 1, 24, 24, 20); g.addColorStop(0, '#ff9fb0'); g.addColorStop(1, '#e8264f');
		ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(24, 41);
		ctx.bezierCurveTo(4, 28, 4, 9, 15, 9); ctx.bezierCurveTo(20, 9, 23, 12, 24, 15);
		ctx.bezierCurveTo(25, 12, 28, 9, 33, 9); ctx.bezierCurveTo(44, 9, 44, 28, 24, 41); ctx.fill();
		ell(ctx, 14.5, 15.5, 4, 2.4, 'rgba(255,255,255,0.7)', -0.7);
	});
}
