import { Application, Skin, Style, Text, Behavior } from "piu/MC";

/*
 * Moddable SDK + TypeScript / M5Stack CoreS3 technical-validation sample.
 *
 * A minimal Piu GUI app for the CoreS3's 320x240 touch display.
 * Tapping the screen increments a counter — this exercises the display,
 * the touch driver, and the TypeScript toolchain together.
 */

const backgroundSkin = new Skin({ fill: "#1e1e2e" });

// Text styles. Note: `Text` (multi-line) styles use horizontal alignment
// and padding — do not set `vertical` here (that is for single-line `Label`).
const titleStyle = new Style({
	font: "OpenSans-Semibold-28",
	color: "white",
	horizontal: "center",
});

const countStyle = new Style({
	font: "OpenSans-Semibold-28",
	color: "#89b4fa",
	horizontal: "center",
});

const hintStyle = new Style({
	font: "OpenSans-Semibold-16",
	color: "#a6adc8",
	horizontal: "center",
});

// Held at module scope so the touch behavior can update it directly,
// instead of looking the content up by name at runtime.
let count = 0;
const countText = new Text(null, {
	top: 100,
	left: 0,
	right: 0,
	style: countStyle,
	string: "Taps: 0",
});

class CounterBehavior extends Behavior {
	onTouchBegan(_application: Application) {
		count += 1;
		countText.string = `Taps: ${count}`;
	}
}

const application = new Application(null, {
	skin: backgroundSkin,
	active: true, // receive touch events across the whole screen
	Behavior: CounterBehavior,
	contents: [
		new Text(null, {
			top: 40,
			left: 0,
			right: 0,
			style: titleStyle,
			string: "Hello M5Stack",
		}),
		countText,
		new Text(null, {
			top: 170,
			left: 0,
			right: 0,
			style: hintStyle,
			string: "Moddable + TypeScript\nTap the screen",
		}),
	],
});

export default application;
