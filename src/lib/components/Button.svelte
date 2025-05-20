<script>
  export let type = 'button';
  export let variant = 'primary';
  export let disabled = false;
</script>

<button 
  {type} 
  class="button {variant}" 
  {disabled} 
  on:click
>
  <slot></slot>
</button>

<style>
  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s, transform 0.1s;
  }
  
  .button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .primary {
    background-color: #4a86e8;
    color: white;
  }
  
  .secondary {
    background-color: #f1f1f1;
    color: #333;
    border: 1px solid #ddd;
  }
  
  .danger {
    background-color: #e74c3c;
    color: white;
  }
</style>