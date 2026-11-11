// Rosa's Shot - 파스텔 도트 스프라이트 (말티푸, 꽃 아이템, 보스)
// 좌우 대칭인 그림은 왼쪽 절반(가운데 칸 포함)만 적고 sym()으로 뒤집어 붙인다.
const sym = rows => rows.map(r => r + [...r.slice(0, -1)].reverse().join(''));   // 가로 폭 홀수
const symE = rows => rows.map(r => r + [...r].reverse().join(''));               // 가로 폭 짝수

// B=몸 색, A=무늬 색 (변형으로 바꿔 끼운다), W=날개/흰색, n=살구, t=민트블루, v=보라
const EXTRA_PAL = {
	B: '#c9b7ff', A: '#ffe066', n: '#ffd0b0', t: '#8fe0d8', v: '#b8a0e8', d: '#ffd9e6', e: '#e8e0f0'
};

const EXTRA_SPR = {
	// ---- 내 비행선: 흰 말티푸 (폭신한 털, 늘어진 귀, 하늘색 날개, 꼬리 불꽃) ----
	player: { px: 4, rows: sym([
		'....oooo',
		'..ooxwww',
		'.oxwwwww',
		'oocwwwww',
		'occwkkww',
		'occwkwww',
		'occwwwkk',
		'.occwwwp',
		'..owwwwp',
		'..oowwww',
		'.obboooo',
		'obbbbbbb',
		'.bb.bffo',
		'.....fyf'
	]) },

	// ---- 꽃 아이템 ----
	sakura: { px: 4, rows: sym([       // 벚꽃: 체력 회복
		'..oo.',
		'.oppo',
		'oppwp',
		'opwyy',
		'oppwp',
		'.oppo',
		'..oo.'
	]) },
	sunflower: { px: 4, rows: sym([    // 해바라기: 총알 강화
		'..oyo',
		'.oyyy',
		'oyfff',
		'oyfof',
		'oyfff',
		'.oyyy',
		'..oyo',
		'...gg'
	]) },
	rose: { px: 4, rows: sym([         // 장미: 폭탄
		'..ooo',
		'.orrr',
		'orrpp',
		'orprr',
		'orrrr',
		'.orrr',
		'..ogo',
		'.ggog'
	]) },
	moon: { px: 4, rows: symE([        // 보름달: 방패 아이콘
		'...oo',
		'..occ',
		'.occy',
		'occcc',
		'occyy',
		'occcy',
		'.occc',
		'..occ',
		'...oo'
	]) },
	petal: { px: 3, rows: ['pp.', 'ppp', '.pp'] },

	// ---- 소보스: 곤충 5종 (파리, 모기, 무당벌레, 거미, 나방) ----
	sb0: { px: 5, rows: sym([
		'..bb.....',
		'.bbbbo...',
		'.bbbbbooo',
		'..bbboBBB',
		'....oBrrB',
		'....oBrkB',
		'....oBBBB',
		'.....oBww',
		'....ooBBB',
		'...oBBBBB',
		'...oBAABB',
		'....oBBBB',
		'.....ooo.'
	]) },
	sb1: { px: 5, rows: sym([
		'..bbb....',
		'.bbbbbo..',
		'..bbbbooo',
		'.....oBBB',
		'....oBkBB',
		'....oBwBB',
		'.....oBBB',
		'......oBp',
		'.......op',
		'.......op',
		'.....ooBB',
		'....oBAAA',
		'.....oBBB',
		'....o.o.o'
	]) },
	sb2: { px: 5, rows: sym([
		'.....o...',
		'......o..',
		'.....oooo',
		'...ooBBBB',
		'..oBBkBBB',
		'..oBBwBBB',
		'.oBBBBBBp',
		'.oAAABBBo',
		'.oAAABBBo',
		'.oBBBBBBo',
		'..oBBBABo',
		'...ooBBBo',
		'..oo..oo.'
	]) },
	sb3: { px: 5, rows: sym([
		'.oo......',
		'o..oo.ooo',
		'...oooBBB',
		'....oBBBB',
		'...oBwkBB',
		'..ooBBBBB',
		'.o.oBBBpB',
		'o..oBAABB',
		'...oBBBBB',
		'....oBBBB',
		'.....oooo'
	]) },
	sb4: { px: 5, rows: sym([
		'....o....',
		'.....o...',
		'.ooooo.oo',
		'oAAAAAoBB',
		'oAwwAAoBk',
		'oAwwAAoBB',
		'oAAAAAoBp',
		'.oAAAAoBB',
		'..oAAAoBB',
		'...oooBBB',
		'......oBB',
		'.......oo'
	]) },

	// ---- 중보스: 징그러운 바다 생물을 귀엽게 (문어, 아귀, 장어, 오징어, 블롭피쉬) ----
	mb0: { px: 5, pal: { B: '#ffb3c8', A: '#ff9fb5' }, rows: sym([
		'........ooo',
		'......ooBBB',
		'....ooBBBBB',
		'...oBBBBBBB',
		'..oBBBBBBBB',
		'..oBBwwBBBB',
		'..oBBwkBBBB',
		'..oBBBBBBBB',
		'..oBpBBBBBB',
		'...oBBBBBBB',
		'.oBBoBBoBBB',
		'oBBoBBoBBoB',
		'oBo.oBo.oBo',
		'oAo.oAo.oAo'
	]) },
	mb1: { px: 5, pal: { B: '#8fe0d8', A: '#fff3b0' }, rows: sym([
		'..........y',
		'..........o',
		'......ooooo',
		'....ooBBBBB',
		'...oBBBBBBB',
		'..oBBBBBBBB',
		'..oBBwwBBBB',
		'..oBBwkBBBB',
		'..oBBBBBBBB',
		'.oBBBBBBBBB',
		'.owowowowow',
		'.okkkkkkkkk',
		'..okkkkkkkk',
		'....ooooooo'
	]) },
	mb2: { px: 5, pal: { B: '#d9c7ff', A: '#ffb3c8' }, rows: sym([
		'.......oooo',
		'.....ooBBBB',
		'....oBBBBBB',
		'...oBBBBBBB',
		'...oBBwwBBB',
		'...oBBwkBBB',
		'...oBBBBBBB',
		'...oBBpBBBB',
		'....oBBBBBB',
		'.ooo.oBBBBB',
		'oBBBo.ooBBB',
		'oBABBo..oBB',
		'.oBABBooBBB',
		'..ooBBBBooo'
	]) },
	mb3: { px: 5, pal: { B: '#ffd0b0', A: '#ffb3c8' }, rows: sym([
		'..........o',
		'.........oB',
		'........oBB',
		'.......oBBB',
		'......oBBBB',
		'....ooBBBBA',
		'...oBBBBBAA',
		'..oBBwwBBBB',
		'..oBBwkBBBB',
		'..oBBBBBBBB',
		'..oBpBBBBBB',
		'...oBBoBBoB',
		'..oBBoBBoBB',
		'..oAo.oAo.o'
	]) },
	mb4: { px: 5, pal: { B: '#ffc2d4', A: '#ff9fb5' }, rows: sym([
		'.......oooo',
		'....ooBBBBB',
		'...oBBBBBBB',
		'..oBBBBBBBB',
		'.oBBwwBBBBB',
		'.oBBwkBBBBB',
		'.oBBBBBBppp',
		'.oBBBBBpppp',
		'.oBBBBBBppo',
		'.oBBBBBBBBo',
		'..oBBooBBoo',
		'...oBBBBBo.',
		'....oooooo.'
	]) },

	// ---- 최종 보스: UFO 두 종 ----
	ub0: { px: 5, rows: sym([
		'.........oooo',
		'.......ooBBBB',
		'......obbbbbb',
		'.....obbbggbb',
		'.....obbggggg',
		'.....obbgkkgg',
		'.....obbggggg',
		'..ooooooooooo',
		'.oBBBBBBBBBBB',
		'oBBByBBByBBBy',
		'oBBBBBBBBBBBB',
		'.oooooooooooo',
		'....y.....y.y'
	]) },
	ub1: { px: 5, pal: { B: '#ffb3c8', b: '#e6dcff', g: '#fff0a0' }, rows: sym([
		'............o',
		'............o',
		'.........oooo',
		'.......ooBBBB',
		'......obbbbbb',
		'.....obbbggbb',
		'.....obbggggg',
		'.....obbgkkgg',
		'.....obbggggg',
		'..ooooooooooo',
		'.oBBBBBBBBBBB',
		'oBBByBBByBBBy',
		'oBBBBBBBBBBBB',
		'.oooooooooooo',
		'....y.....y.y'
	]) }
};

// 색 바꾼 변형: 소보스 5종 x 3색
const EXTRA_VAR = {
	moonflower: ['sunflower', { y: '#9fd8ff', f: '#fff6f2' }]
};
for (let i = 0; i < 5; i++) {
	EXTRA_VAR['sb' + i + '_1'] = ['sb' + i, { B: '#ffb3c8', A: '#fff3b0' }];
	EXTRA_VAR['sb' + i + '_2'] = ['sb' + i, { B: '#a8ecc8', A: '#ffd0b0' }];
}
