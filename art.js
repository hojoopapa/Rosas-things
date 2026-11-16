// Rosa's Shot - 코드로 그리는 정밀 도트 (말티푸 영웅, 눈 레이저, 망토 방패, 구름)
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

// 흰 말티푸 영웅: 망토를 두르고 정면을 보며 날아오른다. open=true 면 입을 벌려 폭탄을 뱉는 모습
function drawDog(ctx, open) {
	const FUR = '#fffdfa', FURS = '#e7dbe6', EAR = '#fbf1e4', EARS = '#e6d3c8', LINE = '#a98aa6';
	// 1. 망토 (뒤로 펄럭이며 늘어짐)
	const cape = () => {
		ctx.beginPath();
		ctx.moveTo(20, 35);
		ctx.bezierCurveTo(10, 41, 4, 53, 5, 60);
		ctx.quadraticCurveTo(9, 64, 14, 59.5); ctx.quadraticCurveTo(19, 64.5, 24, 60);
		ctx.quadraticCurveTo(28, 64.5, 32, 60.5); ctx.quadraticCurveTo(36, 64.5, 40, 60);
		ctx.quadraticCurveTo(45, 64.5, 50, 59.5); ctx.quadraticCurveTo(55, 64, 59, 60);
		ctx.bezierCurveTo(60, 53, 54, 41, 44, 35);
		ctx.closePath();
	};
	fluff(ctx, cape, '#ff6f8c', '#cf3a60', 0, -3);
	ctx.strokeStyle = '#b02c52'; ctx.lineWidth = 1;
	[[32, 42, 14, 59], [32, 42, 24, 60], [32, 42, 40, 60], [32, 42, 50, 59], [24, 40, 8, 55], [40, 40, 56, 55]].forEach(([x1, y1, x2, y2]) => {
		ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2 + (x2 < x1 ? -3 : 3), (y1 + y2) / 2, x2, y2); ctx.stroke();
	});
	ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 1.1; // 금빛 단
	ctx.beginPath(); ctx.moveTo(5.5, 60); ctx.quadraticCurveTo(9, 63.6, 14, 59.2); ctx.quadraticCurveTo(19, 64, 24, 59.8);
	ctx.quadraticCurveTo(28, 64, 32, 60.2); ctx.quadraticCurveTo(36, 64, 40, 59.8); ctx.quadraticCurveTo(45, 64, 50, 59.2); ctx.quadraticCurveTo(55, 63.6, 58.6, 60); ctx.stroke();

	// 2. 몸통과 앞발
	fluff(ctx, furPath(ctx, 32, 46, 9.5, 7, 3.2, 0.2, Math.PI - 0.2, 0.92), FUR, FURS);
	ell(ctx, 23.5, 52.5, 3.6, 4.4, FUR, 0.3, LINE, 0.9); ell(ctx, 40.5, 52.5, 3.6, 4.4, FUR, -0.3, LINE, 0.9);
	ell(ctx, 23.2, 54.2, 1.5, 1.2, '#ffb3c6'); ell(ctx, 40.8, 54.2, 1.5, 1.2, '#ffb3c6'); // 발바닥

	// 3. 귀 (축 늘어진 클립)
	[-1, 1].forEach(sd => {
		const ex = 32 + sd * 15.5;
		fluff(ctx, furPath(ctx, ex, 31, 7.2, 6, 2.6, sd < 0 ? 1.5 : -0.1, sd < 0 ? 3.2 : 1.7, 1.15), EAR, EARS, sd * 1.2, -2);
	});

	// 4. 머리
	const head = furPath(ctx, 32, 24, 14, 14, 4.4, Math.PI * 0.95, Math.PI * 2.05, 0.93);
	fluff(ctx, head, FUR, FURS);
	// 5. 정수리 묶음머리와 리본
	fluff(ctx, furPath(ctx, 33, 7.5, 4.6, 5, 2.2, Math.PI, Math.PI * 2, 1), FUR, FURS, -1, -1.4);
	ctx.fillStyle = '#ff6b81';
	ctx.beginPath(); ctx.moveTo(33, 11); ctx.lineTo(26.5, 8); ctx.lineTo(27, 13.8); ctx.closePath(); ctx.fill();
	ctx.beginPath(); ctx.moveTo(33, 11); ctx.lineTo(39.5, 8); ctx.lineTo(39, 13.8); ctx.closePath(); ctx.fill();
	ell(ctx, 33, 11, 1.9, 1.9, '#ff3d63');

	// 6. 얼굴: 눈, 코, 입, 볼터치
	ell(ctx, 21.2, 30.6, 3.3, 2.1, 'rgba(255,150,175,0.65)'); ell(ctx, 42.8, 30.6, 3.3, 2.1, 'rgba(255,150,175,0.65)');
	[25.5, 38.5].forEach(x => {
		ell(ctx, x, 25.3, 3.1, 3.7, '#3a2640');
		ell(ctx, x + 0.1, 26.1, 1.5, 1.9, '#ff3d63');          // 눈에서 나갈 붉은 빛
		ell(ctx, x - 1, 23.9, 1.1, 1.3, '#ffffff');             // 반짝임
	});
	ell(ctx, 32, 31, 3.2, 2.3, '#2b1d33'); ell(ctx, 31, 30.2, 1, 0.7, '#ffffff');
	ctx.strokeStyle = '#3a2640'; ctx.lineWidth = 1;
	if (open) {                                                    // 입 벌림: 폭탄 발사
		ell(ctx, 32, 36.4, 3.6, 3.4, '#7d2f52');
		ell(ctx, 32, 37.8, 2.3, 1.7, '#ff8fa5');
	} else {
		ctx.beginPath(); ctx.moveTo(32, 32.6); ctx.lineTo(32, 34.3); ctx.stroke();
		ctx.beginPath(); ctx.arc(29.9, 34.3, 2.1, 0, Math.PI); ctx.stroke();
		ctx.beginPath(); ctx.arc(34.1, 34.3, 2.1, 0, Math.PI); ctx.stroke();
		ell(ctx, 32, 37.2, 1.7, 1.6, '#ff8fa5');
	}
	// 7. 목 매듭(금 단추)과 끈
	ctx.strokeStyle = '#d6385f'; ctx.lineWidth = 1.6;
	ctx.beginPath(); ctx.moveTo(23, 38.5); ctx.quadraticCurveTo(28, 43, 32, 41.5); ctx.quadraticCurveTo(36, 43, 41, 38.5); ctx.stroke();
	ell(ctx, 32, 41.5, 2.9, 2.9, '#ffd24d', 0, '#c98a12', 0.8); ell(ctx, 31.2, 40.6, 0.9, 0.9, '#fff6c8');
}

function makeDogTex(scene, key, S, open) {
	if (scene.textures.exists(key)) return;
	const N = 64 * S, c = scene.textures.createCanvas(key, N, N), ctx = c.getContext('2d');
	ctx.scale(S, S);
	drawDog(ctx, open);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	crisp(ctx, N, N, { outline: [74, 40, 78], mix: 0.28 });
	c.refresh();
}

// 망토 방패: 개를 감싸며 펼쳐지는 둥근 망토 (가운데는 비워서 개가 보이게)
function makeCapeShield(scene) {
	const S = 200, c = scene.textures.createCanvas('capeShield', S, S), ctx = c.getContext('2d');
	const cx = S / 2, cy = S / 2;
	const g = ctx.createRadialGradient(cx, cy, 70, cx, cy, 100);
	g.addColorStop(0, 'rgba(255,150,175,0)'); g.addColorStop(0.55, 'rgba(255,150,175,0.35)'); g.addColorStop(1, 'rgba(255,150,175,0)');
	ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
	// 망토 몸체: 위쪽이 둥글고 아래 단이 물결치는 종 모양
	const R = 84, n = 9;
	const body = () => {
		ctx.beginPath();
		ctx.moveTo(cx - R, cy + 44);
		ctx.bezierCurveTo(cx - R - 6, cy - 30, cx - 52, cy - R - 2, cx, cy - R - 2);
		ctx.bezierCurveTo(cx + 52, cy - R - 2, cx + R + 6, cy - 30, cx + R, cy + 44);
		for (let i = n; i > 0; i--) { // 아래 단: 물결
			const x0 = cx - R + (2 * R) * (i / n), x1 = cx - R + (2 * R) * ((i - 1) / n);
			ctx.quadraticCurveTo((x0 + x1) / 2, cy + 44 + (i % 2 ? 20 : 12), x1, cy + 44);
		}
		ctx.closePath();
	};
	fluff(ctx, body, '#ff7a96', '#c93461', 0, 6);
	ctx.save(); body(); ctx.clip();
	// 주름: 위 가운데에서 단 끝으로 퍼지는 곡선 (구멍을 내기 전에 그려서 가운데 비운 부분엔 남지 않는다)
	ctx.strokeStyle = 'rgba(150,30,70,0.55)'; ctx.lineWidth = 2;
	for (let i = 0; i <= n; i++) {
		const ex = cx - R + (2 * R) * (i / n), a = (i / n - 0.5);
		ctx.beginPath(); ctx.moveTo(cx + a * 30, cy - R + 6); ctx.quadraticCurveTo(cx + a * 150, cy - 10, ex, cy + 52); ctx.stroke();
	}
	ctx.strokeStyle = 'rgba(255,200,215,0.7)'; ctx.lineWidth = 2;
	for (let i = 0; i < n; i++) {
		const ex = cx - R + (2 * R) * ((i + 0.5) / n), a = ((i + 0.5) / n - 0.5);
		ctx.beginPath(); ctx.moveTo(cx + a * 30, cy - R + 9); ctx.quadraticCurveTo(cx + a * 140, cy - 14, ex, cy + 46); ctx.stroke();
	}
	// 안감(가운데를 비운다): 개가 보이도록 구멍을 낸다
	ctx.globalCompositeOperation = 'destination-out';
	const hole = ctx.createRadialGradient(cx, cy + 6, 40, cx, cy + 6, 74);
	hole.addColorStop(0, 'rgba(0,0,0,1)'); hole.addColorStop(0.85, 'rgba(0,0,0,0.9)'); hole.addColorStop(1, 'rgba(0,0,0,0)');
	ctx.fillStyle = hole; ctx.fillRect(0, 0, S, S);
	ctx.globalCompositeOperation = 'source-over';
	ctx.restore();
	// 금빛 단
	ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 4;
	ctx.beginPath(); ctx.moveTo(cx - R, cy + 44);
	for (let i = n; i > 0; i--) {
		const x0 = cx - R + (2 * R) * (i / n), x1 = cx - R + (2 * R) * ((i - 1) / n);
		ctx.quadraticCurveTo((x0 + x1) / 2, cy + 44 + (i % 2 ? 20 : 12), x1, cy + 44);
	}
	ctx.stroke();
	// 윗부분 금 단추
	ell(ctx, cx, cy - R + 4, 9, 9, '#ffd24d', 0, '#c98a12', 2); ell(ctx, cx - 3, cy - R + 1, 3, 3, '#fff6c8');
	crisp(ctx, S, S, { levels: [0, 70, 150, 215, 255], outline: [96, 28, 66], mix: 0.25 });
	c.refresh();
}

// 방패 버튼 아이콘: 작은 망토
function makeCapeIcon(scene) {
	const S = 44, c = scene.textures.createCanvas('capeIcon', S, S), ctx = c.getContext('2d');
	const body = () => {
		ctx.beginPath();
		ctx.moveTo(12, 6); ctx.bezierCurveTo(5, 12, 3, 28, 4, 38);
		ctx.quadraticCurveTo(8, 42, 12, 37); ctx.quadraticCurveTo(17, 43, 22, 38); ctx.quadraticCurveTo(27, 43, 32, 37);
		ctx.quadraticCurveTo(36, 42, 40, 38); ctx.bezierCurveTo(41, 28, 39, 12, 32, 6);
		ctx.quadraticCurveTo(22, 2, 12, 6); ctx.closePath();
	};
	fluff(ctx, body, '#ff7a96', '#c93461', 0, -2);
	ctx.strokeStyle = 'rgba(150,30,70,0.6)'; ctx.lineWidth = 1;
	[[22, 8, 10, 38], [22, 8, 22, 39], [22, 8, 34, 38]].forEach(([a, b, x, y]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + x) / 2, 22, x, y); ctx.stroke(); });
	ell(ctx, 22, 7, 3.4, 3.4, '#ffd24d', 0, '#c98a12', 0.8);
	crisp(ctx, S, S, { outline: [96, 28, 66], mix: 0.25 });
	c.refresh();
}

// 눈에서 번쩍이는 작은 불빛
function makeEyeFlash(scene) {
	const S = 16, c = scene.textures.createCanvas('eyeflash', S, S), ctx = c.getContext('2d');
	const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
	g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,120,150,0.95)'); g.addColorStop(1, 'rgba(255,61,99,0)');
	ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
	ctx.fillStyle = '#fff'; ctx.fillRect(7, 1, 2, 14); ctx.fillRect(1, 7, 14, 2);
	crisp(ctx, S, S, { levels: [0, 110, 200, 255] });
	c.refresh();
}

// 구름: 동그란 뭉치를 겹쳐 그리고 아래쪽에 옅은 그림자 (세로로 이어 붙는 스크롤용)
function makeClouds(scene) {
	const c = scene.textures.createCanvas('clouds', W, H), ctx = c.getContext('2d');
	for (let i = 0; i < 9; i++) {
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
