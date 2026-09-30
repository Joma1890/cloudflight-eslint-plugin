<template><button @click="submit">Go</button></template>
<script setup lang="ts">
import {ref} from 'vue';
const value = ref('');
function submit(): void {
    Promise.resolve(value.value);
}
</script>
