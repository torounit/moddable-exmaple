import { Application, Skin, Style, Text, Behavior } from "piu/MC";

// M5Stack CoreS3 (320x240 タッチ液晶) 向けの最小 Piu アプリ。
// 画面タップでカウンタが増える = 表示・タッチ・TypeScript の疎通確認。
//
// Piu 公式のイディオム: テンプレートで data($) を親→子へ流し、`anchor` を
// 付けたコンテンツはその data に自分を差し込む。Behavior は onCreate で
// 受け取った this.data[anchor] を参照する。

type Model = { count: number; countText?: Text };

const style = new Style({ font: "OpenSans-Semibold-28", color: "white", horizontal: "center" });

class CounterBehavior extends Behavior {
	declare data: Model;
	onCreate(_application: Application, data: Model) {
		this.data = data;
	}
	onTouchBegan(_application: Application) {
		this.data.count += 1;
		this.data.countText!.string = `Taps: ${this.data.count}`;
	}
}

// data($) を受け取り、自身を $.countText へ差し込むカウンタ表示。
const CountText = Text.template(($: Model) => ({
	anchor: "countText",
	top: 130, left: 0, right: 0,
	style,
	string: `Taps: ${$.count}`,
}));

const CounterApplication = Application.template(($: Model) => ({
	skin: new Skin({ fill: "#1e1e2e" }),
	active: true, // 画面全体でタッチを受け取る
	contents: [
		new Text(null, { top: 70, left: 0, right: 0, style, string: "Hello M5Stack" }),
		new CountText($), // 同じ data を流し込む → $.countText がバインドされる
	],
	Behavior: CounterBehavior,
}));

export default new CounterApplication({ count: 0 } as Model);
