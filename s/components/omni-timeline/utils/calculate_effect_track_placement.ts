import {AnyEffect} from "../../../context/controllers/timeline/types.js"

export function calculate_effect_track_placement(track_index: number, effects: AnyEffect[]) {
	let track_start = 0

	for (let i = 0; i < track_index; i++) {
		const video_effect = effects.find(effect => effect.track === i && effect.kind === "video")
		const text_effect = effects.find(effect => effect.track === i && effect.kind === "text")

		let trackHeight = 50

		if (!video_effect && text_effect) {
			trackHeight = 30
		}

		track_start += trackHeight
	}

	return track_start
}
