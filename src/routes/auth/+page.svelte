<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    goto('/auth/dashboard');
  });
</script>

<!-- Redirect homepage to dashboard -->