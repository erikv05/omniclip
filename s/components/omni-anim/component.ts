import {Op, html, css} from "@benev/slate"

import {styles} from "./styles.js"
import {Tooltip} from "../../views/tooltip/view.js"
import {shadow_component} from "../../context/context.js"
import {StateHandler} from "../../views/state-handler/view.js"
import {ImageEffect, VideoEffect} from "../../context/types.js"
import circleInfoSvg from "../../icons/gravity-ui/circle-info.svg.js"
import animationSvg from "../../icons/material-design-icons/animation.svg.js"
import {animationIn, animationNone, animationOut} from "../../context/controllers/compositor/parts/animation-manager.js"

export const OmniAnim = shadow_component(use => {
	use.styles(styles)
	use.watch(() => use.context.state)
	const controllers = use.context.controllers
	const [kind, setKind] = use.state<"in" | "out">("in")
	const [animationInDuration, setAnimationInDuration] = use.state(0.5)
	const [animationOutDuration, setAnimationOutDuration] = use.state(0.5)
	const manager = use.context.controllers.compositor.managers.animationManager

	const selectedImageOrVideoEffect = use.context.state.selected_effect?.kind === "video" || use.context.state.selected_effect?.kind === "image"
		? use.context.state.effects.find(effect => effect.id === use.context.state.selected_effect!.id)! as ImageEffect | VideoEffect
		: null

	use.mount(() => {
		const dispose = manager.onChange(() => use.rerender())
		return () => dispose()
	})

	const animationDuration = kind === "in" ? animationInDuration : animationOutDuration

	const imageAndVideoEffects = () => use.context.state.effects.filter(effect => effect.kind === "image" || effect.kind === "video") as VideoEffect[] | ImageEffect[]

	const renderAnimationsIn = () => {
		return animationIn.map(animation => {
			const [name, type] = animation.split("-")
			const anim = {type: "in" as "in" | "out", name: animation, targetEffect: selectedImageOrVideoEffect!, duration: animationDuration}
			return html`
				<div
					?data-selected=${manager.selectedAnimationForEffect(selectedImageOrVideoEffect, anim)}
					?disabled=${!selectedImageOrVideoEffect}
					@click=${() => manager.selectAnimation(selectedImageOrVideoEffect!, anim, use.context.state)}
					class="animation"
				>
					<span class="text">
						${name} ${type}
					</span>
				</div>
		`})
	}

	const renderAnimationsOut = () => {
		return animationOut.map(animation => {
			const [name, type] = animation.split("-")
			const anim = {type: "out" as "in" | "out", name: animation, targetEffect: selectedImageOrVideoEffect!, duration: animationDuration}
			return html`
				<div
					?data-selected=${manager.selectedAnimationForEffect(selectedImageOrVideoEffect, anim)}
					?disabled=${!selectedImageOrVideoEffect}
					@click=${() => manager.selectAnimation(selectedImageOrVideoEffect!, anim, use.context.state)}
					class="animation"
				>
					<span class="text">
						${name} ${type}
					</span>
				</div>
		`})
	}

	const renderAnimationNone = (type: "in" | "out") => {
			return html`
				<div
					?data-selected=${type === "in" ? !manager.isAnyAnimationInSelected(selectedImageOrVideoEffect) : !manager.isAnyAnimationOutSelected(selectedImageOrVideoEffect)}
					?disabled=${!selectedImageOrVideoEffect}
					@click=${() => manager.deselectAnimation(use.context.state, selectedImageOrVideoEffect!, type)}
					class="animation"
				>
					<span class="text">
						${animationNone}
					</span>
				</div>
		`}

	const renderEffectSelectionDropdown = () => {
		return html`
			<div class=flex>
				<select
					@change=${(event: Event) => {
						const target = event.target as HTMLSelectElement
						const effectId = target.value
						const effect = use.context.state.effects.find(effect => effect.id === effectId)!
						controllers.timeline.set_selected_effect(effect, use.context.state)
					}}
					id="clip"
					name="clip"
				>
					<option .selected=${!selectedImageOrVideoEffect} value=none>none</option>
					${imageAndVideoEffects().map(effect => html`<option .selected=${selectedImageOrVideoEffect?.id === effect.id} value=${effect.id}>${effect.name}</option>`)}
				</select>
				${renderDropdownInfo()}
			</div>
		`
	}

	const renderDurationSlider = () => {
		return html`
			<div class=duration-slider>
				<label for="duration">Duration:</label>
				<input
					@input=${(e: InputEvent) => kind === "in"
						? setAnimationInDuration(+(e.target as HTMLInputElement).value)
						: setAnimationOutDuration(+(e.target as HTMLInputElement).value)
					}
					@change=${() => manager.refresh(use.context.state, {duration: animationDuration, kind})}
					type="range"
					min="0.5"
					max="10"
					step="0.1"
					value=${animationDuration}
					name="duration"
					id="duration"
				>
				<span>${animationDuration}s</span>
			</div>
		`
	}

	const renderDropdownInfo = () => {
		return Tooltip([
			circleInfoSvg,
			html`<p>Select video or image either from dropdown menu here, timeline or scene</p>`,
			css`
				:host {
					position: relative;
					top: -25px;
				}`
		])
	}

	return StateHandler(Op.all(
		use.context.helpers.ffmpeg.is_loading.value,
		use.context.is_webcodecs_supported.value), () => html`
		<div class="animations">
			<h2>${animationSvg} Animations</h2>
			<div class="btn-cnt">
				<button ?data-selected=${kind === "in"} @click=${() => setKind("in")}>In</button>
				<button ?data-selected=${kind === "out"} @click=${() => setKind("out")}>Out</button>
			</div>
			${renderEffectSelectionDropdown()}
			${renderDurationSlider()}
			<div class="anim-cnt" ?disabled=${!selectedImageOrVideoEffect}>
				${renderAnimationNone(kind)}
				${kind === "in"
					? renderAnimationsIn()
					: renderAnimationsOut()
				}
			</div>
		</div>
	`)
})
