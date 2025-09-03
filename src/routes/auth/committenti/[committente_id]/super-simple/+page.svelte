<script>
  let count = 0;
  
  function increment() {
    count += 1;
  }
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Super Simple Test</h1>
  <div class="bg-green-100 p-4 rounded">
    <p>Count: {count}</p>
    <button on:click={increment} class="bg-blue-500 text-white px-4 py-2 rounded mt-2">
      Click me!
    </button>
  </div>
</div>