# pinyin-slug

发布或修改文章时，自动将中文标题转换为拼音 slug。

## 功能

- `filter:post.create` — 新建文章时生成拼音 slug
- `filter:post.update` — 修改标题时同步更新 slug
- 中英文混排：中文转拼音，英文/数字直接保留
- 自动去除标点、合并连续分隔符、截断过长 slug

## 示例

| 标题 | slug（separator=`-`） |
|---|---|
| `如何学好 Python` | `ru-he-xue-hao-python` |
| `2024年终总结` | `2024-nian-zhong-zong-jie` |
| `Vue3 + TypeScript 实战` | `vue3-typescript-shi-zhan` |
| `Go 语言并发编程` | `go-yu-yan-bing-fa-bian-cheng` |

## 设置

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `mode` | select | `auto` | `auto` = 仅当 slug 为空时生成；`always` = 每次都覆盖 |
| `separator` | select | `-` | 拼音之间的分隔符（`-` 或 `_`） |
| `max_length` | number | `80` | slug 最大字符数（0 = 不限制） |

## 安装

推 tag 即可触发 CI 自动构建并发布到 GitHub Releases：

```bash
git tag v0.0.3
git push origin v0.0.3
```

或手动打包本地安装：

```bash
pnpm build
zip plugin.zip package.json index.js
```

## 从源码构建（可选）

使用 `pinyin` npm 包，覆盖全部常用汉字，esbuild 打包为单文件 `index.js`：

```bash
pnpm install
pnpm build
```

## 工作原理

使用 [`pinyin`](https://www.npmjs.com/package/pinyin) npm 包将汉字转为拼音音节，
esbuild 打包时将词典内联到 `index.js`，无需外部依赖，可直接在 goja 引擎中运行。

## 注意事项

- `mode=auto` 时，已有非空 slug 的文章**不会被覆盖**（除非 slug 中含中文）
- 多音字取**第一个/最常用**读音（如"重" → `zhong`，而非 `chong`）
- 同音词不做消歧处理，slug 仅用于 URL，不影响搜索
