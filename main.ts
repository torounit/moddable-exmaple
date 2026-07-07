import { Application, Skin, Style, Text, Behavior } from "piu/MC";

// M5Stack CoreS3 (320x240 タッチ液晶) 向けの最小 Piu アプリ。
// 画面タップでカウンタが増える = 表示・タッチ・TypeScript の疎通確認。

const style = new Style({ font: "OpenSans-Semibold-28", color: "white", horizontal: "center" });

let count = 0;
const countText = new Text(null, { top: 130, left: 0, right: 0, style, string: "Taps: 0" });

class CounterBehavior extends Behavior {
	onTouchBegan(_application: Application) {
		count += 1;
		countText.string = `Taps: ${count}`;
	}
}

const application = new Application(null, {
	skin: new Skin({ fill: "#1e1e2e" }),
	active: true, // 画面全体でタッチを受け取る
	Behavior: CounterBehavior,
	contents: [
		new Text(null, { top: 70, left: 0, right: 0, style, string: "Hello M5Stack" }),
		countText,
	],
});

export default application;
