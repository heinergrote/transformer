import {
  AfterViewInit,
  Component, computed, effect,
  ElementRef,
  signal, viewChild,
} from '@angular/core';
import {BaseFabricObject, Canvas, Circle, Point, XY} from 'fabric';
import {DecimalPipe, NgStyle} from '@angular/common';
import {
  findHomographyMatrix,
  TransformMatrix,
  TransformType
} from '../util/homography';


@Component({
  selector: 'app-canvas',
  imports: [
    DecimalPipe,
    NgStyle,
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})
export class CanvasComponent implements AfterViewInit {

  fabricSurface = viewChild.required<ElementRef<HTMLCanvasElement>>('fabricSurface')
  canvas?: Canvas;

  transformType = signal<TransformType>("perspective")
  types: TransformType[] = ["perspective", "affine", "partialAffine"];

  srcPoints = signal<Point[]>([])
  destPoints = signal<Point[]>([])
  destCircles: Circle[] = []
  srcCircles: Circle[] = []

  transform = computed(() => {
    return findHomographyMatrix(this.transformType(), this.srcPoints(), this.destPoints())
  })

  inputs: Point[] = []

  outputDots: Circle[] = []

  matrix3d = computed(() =>
    this.transform().a + ',' + this.transform().d + ',0,' + this.transform().g + ',' +
    this.transform().b + ',' + this.transform().e + ',0,' + this.transform().h + ',' +
    '0,0,1,0,' +
    this.transform().c + ',' + this.transform().f + ',0,' + this.transform().i)

  svgTransform = computed(() => "matrix(" +
    this.transform().a + " " + this.transform().d + " " + this.transform().b + " " +
    this.transform().e + " " + this.transform().c + " " + this.transform().f + ")")

  constructor() {

    // update the dest circles when the points change
    effect(() => {
      this.destPoints().forEach((point, index) => {
        if (this.destCircles[index].getXY().eq(point)) return
        this.destCircles[index].setXY(point)
        this.destCircles[index].setCoords()
      });
    })

    // update the src circles when the points change
    effect(() => {
      this.srcPoints().forEach((point, index) => {
        if (this.srcCircles[index].getXY().eq(point)) return
        this.srcCircles[index].setXY(point)
        this.srcCircles[index].setCoords()
      });
    })

    // render the display when the transformationMatrix changes
    effect(() => {
      this.renderTransformation(this.transform())
    });

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

    const anchorsPadding = 20
    const anchorsSize = 400

    const outputPadding = 120;
    const outputSize = 400;
    const outputStep = 40;

    this.inputs = []
    for (let x = -outputPadding; x <= outputSize + outputPadding; x += outputStep) {
      for (let y = -outputPadding; y <= outputSize + outputPadding; y += outputStep) {
        this.inputs.push(new Point(x, y))
      }
    }

    switch (type) {
      case "perspective":
        this.srcPoints.set([
          new Point(anchorsPadding, anchorsPadding),
          new Point(anchorsSize-anchorsPadding, anchorsPadding),
          new Point(anchorsSize-anchorsPadding, anchorsSize-anchorsPadding),
          new Point(anchorsPadding, anchorsSize-anchorsPadding)
        ])
        break
      case "affine":
        this.srcPoints.set([
          new Point(anchorsSize/2, anchorsPadding),
          new Point(anchorsSize-anchorsPadding, anchorsSize-anchorsPadding),
          new Point(anchorsPadding, anchorsSize-anchorsPadding),
        ])
        break
      case "partialAffine":
        this.srcPoints.set([
          new Point(anchorsPadding, anchorsSize/2),
          new Point(anchorsSize-anchorsPadding, anchorsSize/2),
        ])
        break
    }

    this.destPoints.set(this.srcPoints().slice())

    const canvas = this.canvas
    if (canvas) {
      canvas.clear()
      canvas.backgroundColor = '#d1d5db'
      canvas.selection = true
      canvas.preserveObjectStacking = true

      // add output "lattice" (all at pos 1,1, because fabric seems to have a bug with negative coordinates)
      this.outputDots = this.inputs.map(
        (_) => {
          const dot = this.createCircle({x:1, y:1}, false)
          canvas.add(dot)
          return dot
        }
      )

      this.srcCircles = this.srcPoints().map(
        (_) => {
          const circle = this.createCircle({x:1, y:1}, true)
          canvas.add(circle)
          circle.fill = "#00FF00"
          circle.on("moving", (_) => {
            this.srcPoints.set(this.srcCircles.map((circle) => circle.getXY()))
          })
          return circle
        }
      )
      this.destCircles = this.destPoints().map(
        (_) => {
          const circle = this.createCircle({x:1, y:1}, true)
          canvas.add(circle)
          circle.on("moving", (_) => {
            this.destPoints.set(this.destCircles.map((circle) => circle.getXY()))
          })
          return circle
        }
      )

    }

  }

  createCircle(point: XY, handle: boolean) : Circle {
    return new Circle({
      left: point.x,
      top: point.y,
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

  renderTransformation(tm: TransformMatrix) {

    const outputs = this.inputs.map((input) => {
      const [x, y] = [input.x, input.y]
      const {a,b,c,d,e,f,g, h} = {...tm}
      return new Point(
        (a*x+b*y+c) / (g*x+h*y+1),
        (d*x+e*y+f) / (g*x+h*y+1)
      )
    })
    outputs.forEach((point, index) => {
      this.outputDots[index].setXY(point)
    })
    this.canvas?.renderAll()

  }

  onTransformType(type: TransformType) {
    this.transformType.set(type)
    this.initTransform(this.transformType())
  }

}


