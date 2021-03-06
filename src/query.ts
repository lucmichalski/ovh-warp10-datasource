
export default class Warp10Query {

  readToken = ''
  className = ''
  labels: {[key: string]: string} = {}
  bucketizer = null
  bucketCount = 50
  reducer = null
  reducerLabels: string[] = []
  filter = null
  filterLabels: string[] = []
  filterParamNumber = 0
  filterParamMap: {[key: string]: string} = {}
  filterParamClass = ''
  nameFormat = ''

  bucketizers = [
    'sum', 'max', 'min', 'mean', 'mean.circular', 'bucketizer.mean.circular.exclude-nulls', 'first', 'last', 'join', 'median', 'count', 'and', 'or'
  ]
  reducers = [
    'argmax', 'argmin', 'count', 'count.exclude-nulls', 'count.include-nulls', 'join', 'join.forbid-nulls', 'max', 'max.forbid-nulls', 'mean', 'mean.exclude-nulls', 'mean.circular', 'mean.circular.exclude-nulls', 'median', 'min', 'min.forbid-nulls', 'and', 'and.exclude-nulls', 'or', 'or.exclude-nulls', 'sd', 'shannonentropy.0', 'shannonentropy.1', 'sum', 'sum.forbid-nulls', 'var'
  ]
  filters = [
    { name: 'byclass',  type: 'S' },
    { name: 'bylabels', type: 'M' },
    { name: 'last.eq',  type: 'N' },
    { name: 'last.ne',  type: 'N' },
    { name: 'last.gt',  type: 'N' },
    { name: 'last.ge',  type: 'N' },
    { name: 'last.lt',  type: 'N' },
    { name: 'last.le',  type: 'N' }
  ]

  constructor() {}

  addLabel(key: string, val: string) {
    this.labels[key] = val
  }

  delLabel(key: string) {
    delete this.labels[key]
  }

  addReducerLabel(key: string) {
    this.reducerLabels.push(key)
  }

  delReducerLabel(key: string) {
    let i = this.reducerLabels.indexOf(key)
    if (i != -1)
      this.reducerLabels.splice(i, 1)
  }

  addFilterLabel(key: string) {
    this.filterLabels.push(key)
  }

  delFilterLabel(key: string) {
    let i = this.filterLabels.indexOf(key)
    if (i != -1)
      this.filterLabels.splice(i, 1)
  }

  addFilterParamMapLabel(key: string, val: string) {
    this.filterParamMap[key] = val
  }

  delFilterParamMapLabel(key: string) {
    delete this.filterParamMap[key]
  }

  private static formatStringVar(s: string): string {
    return s.startsWith('$') ? s : `'${ s }'`
  }

  get warpScript(): string {
    const f = Warp10Query.formatStringVar

    let q = '// QUERY BUILDER : AUTOGENERATED \n'
    let labelsStr = ''

    for(let label in this.labels) {
      labelsStr += `${ f(label) } ${ f(this.labels[label]) } `
    }

    q += `[ ${ f(this.readToken) } ${ f(this.className) } { ${ labelsStr } } $end $interval ] FETCH \n`

    if (this.bucketizer)
      q += `[ SWAP ${ this.bucketizer } $end $interval ${ this.bucketCount } / ${ this.bucketCount } ] BUCKETIZE \n`

    if (this.reducer) {
      let labels = this.reducerLabels.map((label) => {
        return `${ f(label) }`
      })
      q += `[ SWAP [ ${ labels.join(' ') } ] ${ this.reducer } ] REDUCE \n`
    }

    if(this.filter) {
      let chosenFilter = this.filters[this.filter]
      let labelsStr = this.filterLabels.map((label) => {
        return f(label)
      })
      let param
      switch (chosenFilter.type) {
        case 'S':
          param = f(this.filterParamClass)
          break
        case 'M':
          param = `'${ JSON.stringify(this.filterParamMap) }' JSON->`
          break
        case 'N':
          param = this.filterParamNumber
          break
      }
      q += `[ SWAP [ ${ labelsStr.join(' ') } ] ${ param } filter.${ chosenFilter.name } ] FILTER \n`
    }

    if (this.nameFormat && (this.nameFormat !== "")) {
      q += `<% DROP DUP DUP ATTRIBUTES SWAP LABELS APPEND "${ this.nameFormat }" SWAP TEMPLATE RENAME %> LMAP\n`
    }

    q += 'SORT \n'
    q += `// END OF GENERATED QUERY \n`
    return q
  }
}