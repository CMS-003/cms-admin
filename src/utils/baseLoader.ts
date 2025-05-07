import { flow, types, cast, IAnyType } from 'mobx-state-tree'

// 默认值问题
// 第一次刷新 判断
// loader的name
// 去掉 type state枚举: init pending success fail/success: true/false state ready/pending

function createItemsLoader<T>(model: IAnyType, fn: Function, customs: { [key: string]: Function } = {}) {
  const unionModel = types.model({
    name: types.optional(types.string, ''),
    // 数据数组
    items: types.array(model),
    // 当前页码
    page: types.optional(types.number, 1),
    // 是否完毕
    isEnded: types.optional(types.boolean, false),
    // 是否加载中
    // 请求状态
    state: types.optional(types.enumeration(['ready', 'pending', 'init']), 'init'),
    // 排列方向
    sort: types.optional(types.enumeration(['asc', 'desc']), 'asc'),
    // 错误信息 success: true/false
    error: types.maybeNull(types.model('error', {
      code: types.union(types.number, types.string),
      message: types.maybe(types.string)
    })),
  }).views(self => ({
    // 默认属性
    get isEmpty() {
      return self.items.length === 0
    },
    get isLoading() {
      return self.state === 'pending'
    },
    get isError() {
      return self.error !== null
    },
  })).actions(self => ({
    // 默认方法
    setName(name: string) {
      self.name = name
    },
    setData(data: any) {
      self.items = data || []
    },
  })).actions(self => {
    // 自定义方法
    const nw: { [key: string]: Function } = {}
    for (let k in customs) {
      nw[k] = function () { return customs[k].call(self, ...Array.from(arguments)) }
    }
    return nw
  }).actions(self => {
    // 请求
    const request = flow(function* (option = {}, type = 'refresh') {
      const { query = {}, params = {}, data = {} } = option
      if (self.isLoading) {
        return
      }
      self.state = 'pending'
      self.error = null
      if (type === 'more') {
        query.page = ++self.page
      } else {
        self.page = 1
      }
      let res = null
      try {
        res = yield fn({ query, params }, type)
        let { ended } = res
        const items = res.items || res.data
        self.isEnded = !!ended
        if (type === 'refresh') {
          // 刷新
          if (self.sort === 'asc') {
            self.items = items
          } else {
            self.items = items.reverse()
          }
        } else if (items.length > 0) {
          // 加载更多
          if (self.sort === 'asc') {
            self.items.push(...items)
          } else {
            self.items.unshift(...items)
          }
        } else {
          self.page = self.page - 1
        }
      } catch (err: any) {
        const data = (err['response'] && err['response']['data']) || err
        // 加载失败
        if (data && data.code) {
          self.error = { code: data.code, message: data.message }
        } else {
          self.error = { code: 'unknown', message: '未知错误' }
        }
      } finally {
        self.state = 'ready'
      }
      return res
    })
    return {
      clear() {
        self.page = 1
        self.items = cast([])
      },
      toggleSort() {
        self.sort = self.sort === 'asc' ? 'desc' : 'asc'
        self.items = cast(self.items.reverse())
      },
      remove(index: number) {
        self.items = cast(self.items.slice().filter((item, idx) => +index !== +idx))
      },
      append(item: T) {
        self.items.push(item)
      },
      async refresh(option: object) {
        return await request(option, 'refresh')
      },
      async loadMore(option: object) {
        return await request(option, 'more')
      }
    }
  })

  return types.optional(unionModel, {})
}

export {
  createItemsLoader,
}