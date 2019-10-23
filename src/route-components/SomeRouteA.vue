<template>
  <a-layout :style="{maxHeight: 'inherit'}">
    <a-layout-sider width="300" theme="light" :style="{maxHeight: 'inherit', overflow: 'auto', borderRight: '1px solid #e8e8e8'}">
      <a-card :bodyStyle="{padding: '0'}" :style="{marginTop: '-2px', marginLeft: '-2px', marginBottom: '-1px', borderRight: 'none'}">
        <router-link tag="a-card-grid" :class="{active: $route.params.id === i}" v-for="i in 100" v-bind:key="i" :to="{name: 'a', params: {id: i}}">
          left {{ i }} sidebar
        </router-link>
      </a-card>
    </a-layout-sider>
    <a-layout-content :style="{padding: '12px 16px'}">
      <router-view />
      <a-card style="width: 300px">
        <p>Card content</p>
        <p>Card content</p>
        <p>Card content</p>
        <div class="clearfix"></div>
        <a-timeline reverse>
          <span slot="pending">Somependingstuff</span>
          <a-timeline-item color="green">Create a services site 2015-09-01</a-timeline-item>
          <a-timeline-item color="green">Create a services site 2015-09-01</a-timeline-item>
          <a-timeline-item color="red">
            <!-- <p>Solve initial network problems 1</p> -->
            <!-- <p>Solve initial network problems 2</p> -->
            Solve initial network problems 3 2015-09-01
          </a-timeline-item>
          <a-timeline-item>
            Technical testing 1
            <!-- <p>Technical testing 2</p> -->
            <!-- <p>Technical testing 3 2015-09-01</p> -->
          </a-timeline-item>
        </a-timeline>
      </a-card>

      <h1>{{ msg }}</h1>
      <pre class="alert alert-warning">{{ $route.params }}</pre>

      <div>
        <h2>Name: {{ $auth.user.name }}</h2>
        <p>Mail: {{ $auth.user.email }}</p>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script>
export default {
  name: 'RouteA',
  props: {
    msg: String
  }
}
</script>

<style scoped lang="scss">
  .ant-card-grid {
    width: 100%;
    cursor: pointer;
    -webkit-transition: all 0.15s;
    transition: all 0.15s;
    &:active {
      // background-color: #f9f9f9;
      // -webkit-box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
      // box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
    }
    &.active {
      background-color: #fef9ed;
      -webkit-box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
      box-shadow: inset 2px 3px 3px rgba(0,0,0,.05);
    }
  }
</style>
