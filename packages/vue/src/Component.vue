<script setup lang="ts">
import { fooBar } from "@shipwright-sh/package-core";
import { ref } from "vue";

const count = ref(0);

function increment() {
	console.log(count.value);
	count.value++;
}
</script>

<template>
	<div>
		<p>Count: {{ count }}</p>
		<p>FooBar: {{ fooBar(count) }}</p>
	</div>
	<button type="button" @click="increment">Increment</button>
</template>