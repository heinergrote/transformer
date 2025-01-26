import {index, lusolve, matrix, re} from 'mathjs';

export interface TransformMatrix {
  a:number, b:number, c:number, d:number, e:number, f:number, g:number, h:number, i:number
}

interface Point {
  x:number, y:number
}

export const identityMatrix: TransformMatrix = {
  a:1, b:0, c:0,
  d:0, e:1, f:0,
  g:0, h:0, i:1
}

export function findHomography(src: Point[], dst: Point[]) : TransformMatrix {

  if (src.length < 4 || dst.length < 4) return identityMatrix

  // create the 8x8 matrix and the 8x1 vector
  const m: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [s, d] = [src[i], dst[i]]

    // push values in m and b
    m.push([s.x, s.y, 1, 0, 0, 0, -d.x * s.x, -d.x * s.y])
    m.push([0, 0, 0, s.x, s.y, 1, -d.y * s.x, -d.y * s.y])
    b.push(d.x)
    b.push(d.y)

  }

  // solve m * x = b
  const x = lusolve(matrix(m), matrix(b))

  return {
    a: x.get([0, 0]), b: x.get([1, 0]), c: x.get([2, 0]),
    d: x.get([3, 0]), e: x.get([4, 0]), f: x.get([5, 0]),
    g: x.get([6, 0]), h: x.get([7, 0]), i: 1
  };

}

export function findAffine(src: Point[], dst: Point[]) : TransformMatrix {

  if (src.length < 3 || dst.length < 3) return identityMatrix

  // create the 6x6 matrix and the 6x1 vector
  const m: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 3; i++) {
    const [s, d] = [src[i], dst[i]]

    // push values in m and b
    m.push([s.x, s.y, 1, 0, 0, 0])
    m.push([0, 0, 0, s.x, s.y, 1])
    b.push(d.x)
    b.push(d.y)

  }

  // solve m * x = b
  const x = lusolve(matrix(m), matrix(b))

  return {
    a: x.get([0, 0]), b: x.get([1, 0]), c: x.get([2, 0]),
    d: x.get([3, 0]), e: x.get([4, 0]), f: x.get([5, 0]),
    g: 0, h: 0, i: 1
  };

}

export function findPartialAffine(src: Point[], dst: Point[]) : TransformMatrix {

  if (src.length < 2 || dst.length < 2) return identityMatrix

  // create the 4x4 matrix and the 4x1 vector
  const m: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 2; i++) {
    const [s, d] = [src[i], dst[i]]

    // push values in m and b
    m.push([s.x, -s.y, 1, 0])
    m.push([s.y, s.x, 0, 1])
    b.push(d.x)
    b.push(d.y)

  }

  // solve m * x = b
  const x = lusolve(matrix(m), matrix(b))

  return {
    a: x.get([0, 0]), b: -x.get([1, 0]), c: x.get([2, 0]),
    d: x.get([1, 0]), e: x.get([0, 0]), f: x.get([3, 0]),
    g: 0, h: 0, i: 1
  };

}



