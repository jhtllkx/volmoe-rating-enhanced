---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '9a251338-5ee9-4e81-bac8-f4cf087af98d'
  PropagateID: '9a251338-5ee9-4e81-bac8-f4cf087af98d'
  ReservedCode1: 'b6e6e5e2-3d02-4ce6-9af2-01f58eae380e'
  ReservedCode2: 'b6e6e5e2-3d02-4ce6-9af2-01f58eae380e'
---

# vol.moe 显示分级信息（增强版）

基于 [ichiogo/Hueizhi](https://greasyfork.org/zh-CN/scripts/538866) 的原版脚本修改，原脚本地址：https://greasyfork.org/zh-CN/scripts/538866

## 相比原版 v0.2.1 的增强功能

1. **缓存优先+限速补查** — 列表页优先读取本地缓存，无缓存才发起请求；限速 1.5 秒/个、单并发，对站长友好
2. **详情页自动缓存** — 进入漫画详情页时自动将分级信息写入缓存
3. **更新缓存按钮** — 详情页右上角浮动按钮，可手动刷新当前漫画的分级缓存
4. **防重复渲染** — 使用 `dataset.ratingRendered` 标记防止同一链接重复添加标签
5. **正则更宽松** — `r18RE` 适配页面格式变化（`var is_r18\s*=\s*parseInt\(\s*"(\d)"\s*\)`）
6. **新增域名** — 支持 `kzz.moe`；移除已失效的 `kzo.moe`
7. **unknown 样式** — 新增 `.rating-unknown` 灰色样式

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 [volmoe-rating-enhanced.user.js](./volmoe-rating-enhanced.user.js) 查看源码
3. 点击 Raw 按钮或复制全部内容，在 Tampermonkey 中新建脚本粘贴

## 原作者信息

- 原作者：ichiogo, Hueizhi
- 原脚本地址：https://greasyfork.org/zh-CN/scripts/538866
- 许可证：MIT

## 许可证

MIT