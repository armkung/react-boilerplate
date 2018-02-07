import { applySpec, applyTo, concatWith, objOf, is, prepend, append, evolve, traverse, concat, identity, when, isNumber, add, overEvery, pipe, rest, last, get, isEqual } from 'libs/fp'

describe('fp', () => {
  describe('applySpec', () => {
    const data = { a: 1 }
    it('return object', () => {
      const result = applySpec({ b: get('a'), c: 2 })(data)

      expect(result).toEqual({ b: 1, c: 2 })
    })
  })
  describe('concatWith', () => {
    const data = [1]
    it('return array', () => {
      const result = concatWith([2])(data)

      expect(result).toEqual([1, 2])
    })
  })
  describe('applyTo', () => {
    const fn = identity
    it('return 1', () => {
      const result = applyTo(1)(fn)

      expect(result).toEqual(1)
    })
    it('return 2', () => {
      const result = applyTo([2])(fn)

      expect(result).toEqual(2)
    })
    it('return [3]', () => {
      const result = applyTo([[3]])(fn)

      expect(result).toEqual([3])
    })
  })
  describe('objOf', () => {
    const data = 1
    it('return object', () => {
      const result = objOf('a')(data)

      expect(result).toEqual({
        a: 1
      })
    })
  })
  describe('is', () => {
    const data = 1
    it('return true', () => {
      const result = is(Number)(data)

      expect(result).toEqual(true)
    })
  })
  describe('append', () => {
    const data = [1]
    it('return object', () => {
      const result = append(2)(data)

      expect(result).toEqual([1, 2])
    })
  })
  describe('prepend', () => {
    const data = [1]
    it('return object', () => {
      const result = prepend(2)(data)

      expect(result).toEqual([2, 1])
    })
  })
  describe('traverse', () => {
    const data = {
      a: {
        b: [{
          c: 1
        }],
        e: true
      }
    }
    it('return object', () => {
      const result = traverse()(data)

      expect(result).toEqual(data)
    })

    it('return modified object', () => {
      const result = traverse(
        when(
          overEvery([
            isNumber,
            pipe(
              rest(last),
              get('a.e'),
              isEqual(true)
            )
          ]),
          add(1)
        )
      )(data)

      expect(result).toEqual({
        a: {
          b: [{
            c: 2
          }],
          e: true
        }
      })
    })

    it('return list', () => {
      const result = traverse(
        identity,
        (value, path, list) =>  concat(list, [[path, value]]),
        []
      )(data)

      expect(result).toEqual([
        [['a'], { b: [{ c: 1 }], e: true }],
        [['a', 'b'], [{ c: 1 }]],
        [['a', 'b', '0'], { c: 1 }],
        [['a', 'b', '0', 'c'], 1],
        [['a', 'e'], true]
      ])
    })
  })

  describe('evolve', () => {
    const data = {
      a: {
        b: 1
      }
    }
    it('return modified object', () => {
      const result = evolve({
        a : {
          b: add(1)
        }
      })(data)

      expect(result).toEqual({
        a: {
          b: 2
        }
      })
    })
  })

})