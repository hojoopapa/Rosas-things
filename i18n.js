// Rosa's Shot - 다국어 (한국어, English, 日本語, 中文, Español, Français)
const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'fr'];
const LANG_NAMES = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文', es: 'Español', fr: 'Français' };
const I18N = {
	ko: {
		easy: '쉬움', normal: '보통', hard: '어려움', best: '최고 점수', score: '점수',
		stage: '스테이지 {n}', boss: '보스 등장!', midBoss: '중보스 등장!', finalBoss: '최종 보스!',
		stageClear: '스테이지 클리어!', allClear: '모두 클리어!', gameOver: '게임 오버',
		retry: '다시 하기', home: '처음으로', control: '조작 방식', language: '언어', next: '다음 스테이지',
		pad: ['', '밀기', '따라가기', '조이스틱', '빠른 밀기', '좌우 버튼'],
		hint: ['', '← 밀어서 움직여요 →', '← 손가락이 있는 곳으로 가요 →', '← 밀고 있으면 계속 가요 →', '← 살짝만 밀어도 쭉 가요 →', '← 누르고 있으면 가요 →']
	},
	en: {
		easy: 'Easy', normal: 'Normal', hard: 'Hard', best: 'Best', score: 'Score',
		stage: 'STAGE {n}', boss: 'BOSS!', midBoss: 'BIG BOSS!', finalBoss: 'FINAL BOSS!',
		stageClear: 'STAGE CLEAR!', allClear: 'ALL CLEAR!', gameOver: 'GAME OVER',
		retry: 'Retry', home: 'Title', control: 'Controls', language: 'Language', next: 'Next stage',
		pad: ['', 'Slide', 'Follow', 'Joystick', 'Fast slide', 'L/R buttons'],
		hint: ['', '← Slide to move →', '← Follows your finger →', '← Hold a push to keep moving →', '← A small push goes far →', '← Hold left or right →']
	},
	ja: {
		easy: 'かんたん', normal: 'ふつう', hard: 'むずかしい', best: 'ベスト', score: 'スコア',
		stage: 'ステージ {n}', boss: 'ボス とうじょう！', midBoss: '中ボス！', finalBoss: 'ラスボス！',
		stageClear: 'ステージクリア！', allClear: '全クリア！', gameOver: 'ゲームオーバー',
		retry: 'もう一度', home: 'タイトルへ', control: 'そうさ', language: 'ことば', next: '次のステージ',
		pad: ['', 'スライド', 'ついてくる', 'ジョイスティック', 'ハイスピード', '左右ボタン'],
		hint: ['', '← スライドで動かそう →', '← ゆびの位置へ移動 →', '← 押し続けると動くよ →', '← 少し動かすだけで大きく移動 →', '← 左右を押し続けて移動 →']
	},
	zh: {
		easy: '简单', normal: '普通', hard: '困难', best: '最高分', score: '分数',
		stage: '第 {n} 关', boss: 'BOSS 出现！', midBoss: '中BOSS！', finalBoss: '最终BOSS！',
		stageClear: '过关！', allClear: '全部通关！', gameOver: '游戏结束',
		retry: '再来一次', home: '返回标题', control: '操作方式', language: '语言', next: '下一关',
		pad: ['', '滑动', '跟随', '摇杆', '快速滑动', '左右按钮'],
		hint: ['', '← 滑动来移动 →', '← 飞向手指的位置 →', '← 按住推动持续移动 →', '← 轻轻一推就飞远 →', '← 按住左右移动 →']
	},
	es: {
		easy: 'Fácil', normal: 'Normal', hard: 'Difícil', best: 'Récord', score: 'Puntos',
		stage: 'NIVEL {n}', boss: '¡JEFE!', midBoss: '¡JEFE GRANDE!', finalBoss: '¡JEFE FINAL!',
		stageClear: '¡NIVEL SUPERADO!', allClear: '¡TODO COMPLETADO!', gameOver: 'FIN DEL JUEGO',
		retry: 'Reintentar', home: 'Inicio', control: 'Controles', language: 'Idioma', next: 'Siguiente nivel',
		pad: ['', 'Deslizar', 'Seguir', 'Joystick', 'Desliz. rápido', 'Botones I/D'],
		hint: ['', '← Desliza para moverte →', '← Va hacia tu dedo →', '← Mantén para seguir →', '← Un toque, gran avance →', '← Mantén izq. o der. →']
	},
	fr: {
		easy: 'Facile', normal: 'Normal', hard: 'Difficile', best: 'Record', score: 'Score',
		stage: 'NIVEAU {n}', boss: 'BOSS !', midBoss: 'GRAND BOSS !', finalBoss: 'BOSS FINAL !',
		stageClear: 'NIVEAU RÉUSSI !', allClear: 'TOUT TERMINÉ !', gameOver: 'PARTIE TERMINÉE',
		retry: 'Rejouer', home: 'Accueil', control: 'Commandes', language: 'Langue', next: 'Niveau suivant',
		pad: ['', 'Glisser', 'Suivre', 'Joystick', 'Glisse rapide', 'Boutons G/D'],
		hint: ['', '← Glisse pour bouger →', '← Suit ton doigt →', '← Maintiens pour avancer →', '← Un petit geste, un grand pas →', '← Maintiens G ou D →']
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
