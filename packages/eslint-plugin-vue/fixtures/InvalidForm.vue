<template>
    <button @click="submit">
        Go
    </button>
</template>

<script setup lang="ts">
async function loadData(): Promise<string> {
    return Promise.resolve('data');
}

function submit(): void {
    // typed rule: floating promise inside a Vue SFC, requires type information
    loadData();
}
</script>
