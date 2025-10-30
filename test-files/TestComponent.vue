<template>
  <div class="test-component">
    <h1>{{ title }}</h1>
    <Basic :basic-list="basicData" />
    <button @click="handleClick">点击我</button>
  </div>
</template>

<script>
import Basic from './components/basic';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TestComponent',
  components: {
    Basic
  },
  data() {
    return {
      title: '测试组件',
      basicData: []
    };
  },
  methods: {
    handleClick() {
      console.log('Vue组件点击事件');
    }
  }
});
</script>

<style scoped>
.test-component {
  padding: 20px;
}

h1 {
  color: #42b883;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #369870;
}
</style>