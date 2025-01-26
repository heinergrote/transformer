import {
  AfterViewInit,
  Component,
  ElementRef,
  signal, viewChild,
} from '@angular/core';
import {BaseFabricObject, Canvas, Circle, Point, XY} from 'fabric';
import {DecimalPipe, NgStyle} from '@angular/common';
import {
  findHomographyMatrix,
  identityMatrix,
  TransformMatrix,
  TransformType
} from '../util/homography';


@Component({
  selector: 'app-canvas',
  imports: [
    DecimalPipe,
    NgStyle
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})
export class CanvasComponent implements AfterViewInit {

  fabricSurface = viewChild.required<ElementRef<HTMLCanvasElement>>('fabricSurface')

  sourcePoints = signal<XY[]>([])
  destPoints = signal<XY[]>([])
  transformType = signal<TransformType>("perspective")
  types: TransformType[] = ["perspective", "affine", "partialAffine"];

  transform = signal<TransformMatrix>(identityMatrix)
  matrix3d = signal("")

  inputs: Point[] = []
  outputs: Point[] = []
  anchors: Circle[] = []
  outputCircles: Circle[] = []

  canvas?: Canvas;

  constructor() {
  }

  ngAfterViewInit(): void {

    BaseFabricObject.ownDefaults.originX = 'center'
    BaseFabricObject.ownDefaults.originY = 'center'

    this.canvas = new Canvas(this.fabricSurface().nativeElement)
    this.initTransform(this.transformType())

  }

  initTransform(type:TransformType) {
    if (this.canvas) {
      this.canvas.clear()
    }
    setTimeout(() => {
      this.initTransformAsync(type)
    }, 0)

  }

  async initTransformAsync(type:TransformType) {

    const anchorsPadding = 20
    const anchorsSize = 400

    const outputTop = -200;
    const outputLeft = -200;
    const outputSize = 600;

    switch (type) {
      case "perspective":
        this.sourcePoints.set([
          new Point(anchorsPadding, anchorsPadding),
          new Point(anchorsSize-anchorsPadding, anchorsPadding),
          new Point(anchorsSize-anchorsPadding, anchorsSize-anchorsPadding),
          new Point(anchorsPadding, anchorsSize-anchorsPadding)
        ])
        break
      case "affine":
        this.sourcePoints.set([
          new Point(anchorsSize/2, anchorsPadding),
          new Point(anchorsSize-anchorsPadding, anchorsSize-anchorsPadding),
          new Point(anchorsPadding, anchorsSize-anchorsPadding),
        ])
        break
      case "partialAffine":
        this.sourcePoints.set([
          new Point(anchorsPadding, anchorsSize/2),
          new Point(anchorsSize-anchorsPadding, anchorsSize/2),
        ])
        break
    }

    this.destPoints.set(this.sourcePoints().slice())

    this.inputs = []
    this.outputs = []
    for (let x = -outputSize; x <= outputSize*2; x += 40) {
      for (let y = -outputSize; y <= outputSize*2; y += 40) {
        this.inputs.push(new Point(outputLeft + x, outputTop + y))
        this.outputs.push(new Point(outputLeft + x, outputTop + y))
      }
    }

    const canvas = this.canvas
    if (canvas) {
      canvas.clear()
      canvas.backgroundColor = '#d1d5db'
      canvas.selection = true
      canvas.preserveObjectStacking = true

      // add output "lattice"
      this.outputCircles = []
      for (let i = 0; i < this.outputs.length; i++) {
        // initial pos set to 1,1, outside objects seem to be not added
        this.outputCircles.push(this.createCircle({x:1, y:1}, false))
        canvas.add(this.outputCircles[i])
        this.outputCircles[i].setXY(this.outputs[i])
      }

      // create anchors for moving destination points
      this.anchors = this.destPoints().map(
        (destPoint) => this.createCircle(destPoint, true)
      )
      this.anchors.forEach((anchor) => {
        canvas.add(anchor)
        anchor.on("moving", (_) => this.updateTransform())
      })

    }

    this.updateTransform()

  }

  createCircle(xy: XY, handle: boolean) : Circle {
    return new Circle({
      left: xy.x,
      top: xy.y,
      stroke: "#000000",
      fill: handle ? "#FF0000" : "#000000",
      radius: handle ? 8 : 2,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      lockMovementX: !handle,
      lockMovementY: !handle,
      hasBorders: false,
      hasControls: false
    })
  }

  updateTransform() {

    this.destPoints.set(
      this.anchors.map((anchor) => new Point(anchor.getXY()))
    )

    const tm = findHomographyMatrix(
      this.transformType(), this.sourcePoints(), this.destPoints()
    )

    this.transform.set(tm)

    this.outputs = this.inputs.map((input) => {
      const [x, y] = [input.x, input.y]
      const {a,b,c,d,e,f,g, h} = {...this.transform()}
      return new Point(
        (a*x+b*y+c) / (g*x+h*y+1),
        (d*x+e*y+f) / (g*x+h*y+1)
      )
    })

    if (this.outputs.length <= this.outputCircles.length) {
      for (let i = 0; i < this.outputs.length; i++) {
        this.outputCircles[i].setXY(this.outputs[i])
      }
    }

    this.matrix3d.set(
      this.transform().a + ',' + this.transform().d + ',0,' + this.transform().g + ',' +
      this.transform().b + ',' + this.transform().e + ',0,' + this.transform().h + ',' +
      '0,0,1,0,' +
      this.transform().c + ',' + this.transform().f + ',0,' + this.transform().i
    )


  }

  onTransformType(type: TransformType) {
    this.transformType.set(type)
    this.initTransform(this.transformType())
  }
}
