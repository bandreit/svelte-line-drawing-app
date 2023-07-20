<script lang="ts">
	import { PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from '$env/static/private';
	import { onMount } from 'svelte';
	import PubNub, { type MessageEvent, type StatusEvent } from 'pubnub';
	import {
		DrawMessageType,
		type DrawMessage,
		type DrawParamsMoving,
		type OrderedDrawParamsMoving
	} from '$lib/types/Canvas.types';

	const STROKE_LINE_WIDTH = 5;
	const STROKE_LINE_CAP = 'round';

	export let channelId: string;

	$: canDraw = false;

	let isDrawing = false;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let lastTimestamp = new Date().getTime();

	let width = 0;
	let height = 0;

	onMount(() => {
		ctx = getCanvasContext(canvas);
		width = window.innerWidth;
		height = window.innerHeight;
	});

	const myUuid = PubNub.generateUUID();

	const pubnub = new PubNub({
		publishKey: PUBNUB_PUBLISH_KEY,
		subscribeKey: PUBNUB_SUBSCRIBE_KEY,
		uuid: myUuid
	});

	// add listener
	const listener = {
		status: (statusEvent: StatusEvent) => {
			if (statusEvent.category === 'PNConnectedCategory') {
				canDraw = true;
			}
		},
		message: (messageEvent: MessageEvent) => {
			if (messageEvent.publisher === myUuid) {
				return;
			}
			handleMessage(messageEvent.message as DrawMessage);
		}
	};
	pubnub.addListener(listener);

	// publish message
	const publishMessage = async (payload: DrawMessage) => {
		await pubnub.publish({
			channel: channelId,
			message: payload
		});
	};

	// subscribe to a channel
	pubnub.subscribe({
		channels: [channelId]
	});

	const handleMessage = (payload: DrawMessage) => {
		const { type, params } = payload;

		switch (type) {
			case DrawMessageType.MOVING:
				console.log(params.timestamp);

				if (params.timestamp <= lastTimestamp) {
					console.log(`skipped because ${params.timestamp} < ${lastTimestamp}`);
					return;
				}

				lastTimestamp = params.timestamp;
				drawLine(params);
				return;

			case DrawMessageType.END:
				stopDrawing();
				return;
		}
	};

	function handleStartDrawing({ x, y }: DrawParamsMoving) {
		if (!canDraw) return;

		isDrawing = true;
		ctx.moveTo(x, y);
		ctx.beginPath();
	}

	function handleDrawing({ x, y }: DrawParamsMoving) {
		if (!canDraw) return;
		if (!isDrawing) return;

		lastTimestamp = new Date().getTime();

		console.log(lastTimestamp);

		const drawParamsMoving: OrderedDrawParamsMoving = {
			x,
			y,
			color: 'purble',
			timestamp: lastTimestamp
		};

		publishMessage({
			type: DrawMessageType.MOVING,
			params: drawParamsMoving
		});

		drawLine(drawParamsMoving);
	}

	function handleStopDrawing() {
		if (!canDraw) return;

		publishMessage({
			type: DrawMessageType.END,
			params: {}
		});

		stopDrawing();
		isDrawing = false;
	}

	function drawLine({ x, y, color }: DrawParamsMoving) {
		ctx.lineWidth = STROKE_LINE_WIDTH;
		ctx.lineCap = STROKE_LINE_CAP;
		ctx.strokeStyle = color ?? '#c0392b';

		ctx.lineTo(x, y);
		ctx.stroke();
	}

	function stopDrawing() {
		ctx.stroke();
		ctx.beginPath();
	}

	function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
		const ctx = canvas.getContext('2d');
		if (ctx) return ctx;

		throw new Error('Canvas not supported');
	}
</script>

{#if !canDraw}
	<h1>Connecting to channel..</h1>
{/if}

<canvas
	{width}
	{height}
	bind:this={canvas}
	on:pointerdown={handleStartDrawing}
	on:pointermove={handleDrawing}
	on:pointerup={handleStopDrawing}
/>

<style>
	canvas {
		position: absolute;
		top: 0;
		left: 0;
		background-color: #ecf0f1;
	}
</style>
