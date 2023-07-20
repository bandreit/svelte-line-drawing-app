<script>
	import Canvas from './Canvas.svelte';

	export let data;
</script>

<Canvas channelId={data.channel} />
