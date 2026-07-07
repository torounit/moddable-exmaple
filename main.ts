import "piu/MC";
import type { Application, Text } from "piu/MC";

// M5Stack CoreS3 (320x240 タッチ液晶) 向けの最小 Piu アプリ。
// 画面左半分タップで -1、右半分タップで +1。表示・タッチ・TypeScript の疎通確認。
//
// piu/MC のクラス(Application/Skin/Text/Behavior…)はグローバルとして提供される
// ため、`import "piu/MC"` で読み込み、型注釈だけ `import type` する。

type Model = { count: number; countText?: Text };

const style = new Style({ font: "OpenSans-Semibold-28", color: "white", horizontal: "center" });

class CounterBehavior extends Behavior {
	declare data: Model;
	onCreate(_application: Application, data: Model) {
		this.data = data;
	}
	onTouchBegan(application: Application, _id: number, x: number, _y: number, _ticks: number) {
		this.data.count += x < application.width / 2 ? -1 : 1;
		this.data.countText!.string = `Count: ${this.data.count}`;
	}
}

// data($) を受け取り、自身を $.countText へ差し込むカウンタ表示。
const CountText = Text.template(($: Model) => ({
	anchor: "countText",
	top: 130, left: 0, right: 0,
	style,
	string: `Count: ${$.count}`,
}));

const CounterApplication = Application.template(($: Model) => ({
	skin: new Skin({ fill: "#1e1e2e" }),
	active: true, // 画面全体でタッチを受け取る
	contents: [
		new Text(null, { top: 70, left: 0, right: 0, style, string: "Hello M5Stack" }),
		new CountText($, {}), // 同じ data を流し込む → $.countText がバインドされる
	],
	Behavior: CounterBehavior,
}));

export default new CounterApplication({ count: 0 } as Model, {});
