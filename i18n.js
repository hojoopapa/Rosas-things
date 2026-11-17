// Rosa's Shot - 다국어 (한국어, English, 日本語, 中文, Español, Français)
const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'fr'];
const LANG_NAMES = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文', es: 'Español', fr: 'Français' };
const I18N = {
	ko: {
		easy: '쉬움', normal: '보통', hard: '어려움', best: '최고 점수', score: '점수',
		stage: '스테이지 {n}', boss: '보스 등장!', midBoss: '중보스 등장!', finalBoss: '최종 보스!',
		stageClear: '스테이지 클리어!', allClear: '모두 클리어!', gameOver: '게임 오버',
		retry: '다시 하기', home: '처음으로', control: '조작 방식', language: '언어', next: '다음 스테이지',
		dog: '말티푸', cat: '샴고양이', pick: '영웅을 골라요', wbul: '총알', wlas: '레이저', wmis: '유도탄', wnote: '같은 꽃은 레벨업 · 다른 꽃은 한 단계 하락',
		pad: ['', '밀기', '조이스틱'],
		hint: ['', '← 밀어서 좌우로 움직여요 →', '조이스틱을 밀면 전후좌우로 날아요']
	},
	en: {
		easy: 'Easy', normal: 'Normal', hard: 'Hard', best: 'Best', score: 'Score',
		stage: 'STAGE {n}', boss: 'BOSS!', midBoss: 'BIG BOSS!', finalBoss: 'FINAL BOSS!',
		stageClear: 'STAGE CLEAR!', allClear: 'ALL CLEAR!', gameOver: 'GAME OVER',
		retry: 'Retry', home: 'Title', control: 'Controls', language: 'Language', next: 'Next stage',
		dog: 'Maltipoo', cat: 'Siamese cat', pick: 'Choose your hero', wbul: 'Bullet', wlas: 'Laser', wmis: 'Homing', wnote: 'Same flower = level up · other flower = 1 level down',
		pad: ['', 'Slide', 'Joystick'],
		hint: ['', '← Slide to move left and right →', 'Push the stick to fly in any direction']
	},
	ja: {
		easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', best: 'ベスト', score: 'スコア',
		stage: 'ステージ {n}', boss: 'ボス とうじょう！', midBoss: '中ボス！', finalBoss: 'ラスボス！',
		stageClear: 'ステージクリア！', allClear: '全クリア！', gameOver: 'ゲームオーバー',
		retry: 'もう一度', home: 'タイトルへ', control: 'そうさ', language: 'ことば', next: '次のステージ',
		dog: 'マルプー', cat: 'シャム猫', pick: 'ヒーローを選ぼう', wbul: '弾', wlas: 'レーザー', wmis: '誘導弾', wnote: '同じ花でレベルアップ · 違う花は1段階ダウン',
		pad: ['', 'スライド', 'ジョイスティック'],
		hint: ['', '← スライドで左右に動かそう →', 'スティックを倒すと自由に飛べるよ']
	},
	zh: {
		easy: '简单', normal: '普通', hard: '困难', best: '最高分', score: '分数',
		stage: '第 {n} 关', boss: 'BOSS 出现！', midBoss: '中BOSS！', finalBoss: '最终BOSS！',
		stageClear: '过关！', allClear: '全部通关！', gameOver: '游戏结束',
		retry: '再来一次', home: '返回标题', control: '操作方式', language: '语言', next: '下一关',
		dog: '马尔济斯贵宾', cat: '暹罗猫', pick: '选择英雄', wbul: '子弹', wlas: '激光', wmis: '追踪弹', wnote: '同种花升级 · 换花降一级',
		pad: ['', '滑动', '摇杆'],
		hint: ['', '← 滑动来左右移动 →', '推动摇杆可向任意方向飞行']
	},
	es: {
		easy: 'Fácil', normal: 'Normal', hard: 'Difícil', best: 'Récord', score: 'Puntos',
		stage: 'NIVEL {n}', boss: '¡JEFE!', midBoss: '¡JEFE GRANDE!', finalBoss: '¡JEFE FINAL!',
		stageClear: '¡NIVEL SUPERADO!', allClear: '¡TODO COMPLETADO!', gameOver: 'FIN DEL JUEGO',
		retry: 'Reintentar', home: 'Inicio', control: 'Controles', language: 'Idioma', next: 'Siguiente nivel',
		dog: 'Maltipoo', cat: 'Gato siamés', pick: 'Elige tu héroe', wbul: 'Bala', wlas: 'Láser', wmis: 'Guiado', wnote: 'Misma flor: sube · otra flor: baja 1 nivel',
		pad: ['', 'Deslizar', 'Joystick'],
		hint: ['', '← Desliza para ir a izq. y der. →', 'Empuja el stick para volar en cualquier dirección']
	},
	fr: {
		easy: 'Facile', normal: 'Normal', hard: 'Difficile', best: 'Record', score: 'Score',
		stage: 'NIVEAU {n}', boss: 'BOSS !', midBoss: 'GRAND BOSS !', finalBoss: 'BOSS FINAL !',
		stageClear: 'NIVEAU RÉUSSI !', allClear: 'TOUT TERMINÉ !', gameOver: 'PARTIE TERMINÉE',
		retry: 'Rejouer', home: 'Accueil', control: 'Commandes', language: 'Langue', next: 'Niveau suivant',
		dog: 'Maltipoo', cat: 'Chat siamois', pick: 'Choisis ton héros', wbul: 'Balle', wlas: 'Laser', wmis: 'Missile', wnote: 'Même fleur : +1 niveau · autre fleur : -1',
		pad: ['', 'Glisser', 'Joystick'],
		hint: ['', '← Glisse pour aller à gauche et à droite →', 'Pousse le stick pour voler dans toutes les directions']
	}
};

let LANG = (() => {
	try {
		const s = localStorage.getItem('rs_lang');
		if (LANGS.includes(s)) return s;
	} catch (e) { /* 저장 불가 환경은 무시 */ }
	const b = ((navigator.language || 'en') + '').slice(0, 2).toLowerCase();
	return LANGS.includes(b) ? b : 'en';
})();
function setLang(l) {
	LANG = l;
	try { localStorage.setItem('rs_lang', l); } catch (e) { /* 무시 */ }
}
// 번역 문자열 가져오기 ({n} 치환)
function tr(key, n) {
	const v = I18N[LANG][key];
	return typeof v === 'string' ? v.replace('{n}', n) : v;
}
