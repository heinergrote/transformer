import {
  Component,
  computed,
  effect,
  ElementRef,
  signal, viewChild,
} from '@angular/core';
import {BaseFabricObject, Canvas, Circle, Point} from 'fabric';
import {DecimalPipe, NgStyle} from '@angular/common';
import {findAffine, findHomography, findPartialAffine, identityMatrix, TransformMatrix} from '../util/homography';

const outputTop = -200;
const outputLeft = -200;
const outputSize = 600;

const aTop = 20
const aLeft = 20
const aSize = 360

@Component({
  selector: 'app-canvas',
  imports: [
    DecimalPipe,
    NgStyle
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})
export class CanvasComponent {
  fabricSurface = viewChild.required<ElementRef<HTMLCanvasElement>>('fabricSurface')

  s1 = signal<Point>(new Point(aLeft, aTop));
  s2 = signal<Point>(new Point(aLeft+aSize, aTop));
  s3 = signal<Point>(new Point(aLeft+aSize, aTop+aSize));
  s4 = signal<Point>(new Point(aLeft, aTop+aSize));

  d1 = signal<Point>(this.s1().clone());
  d2 = signal<Point>(this.s2().clone());
  d3 = signal<Point>(this.s3().clone());
  d4 = signal<Point>(this.s4().clone());

  inputs : Point[] = []

  outputs = computed(() => {
    return this.inputs.map((input) => {
      const [x, y] = [input.x, input.y]
      const {a,b,c,d,e,f,g, h} = {...this.transform()}
      return new Point(
        (a*x+b*y+c) / (g*x+h*y+1),
        (d*x+e*y+f) / (g*x+h*y+1)
      )
    })
  });

  c1: Circle
  c2: Circle
  c3: Circle
  c4: Circle
  outputCircles: Circle[] = []

  transform = signal<TransformMatrix>(identityMatrix)

  matrix3d = computed(() =>
    this.transform().a + ',' + this.transform().d + ',0,' + this.transform().g + ',' +
    this.transform().b + ',' + this.transform().e + ',0,' + this.transform().h + ',' +
    '0,0,1,0,' +
    this.transform().c + ',' + this.transform().f + ',0,' + this.transform().i
  );


  protected canvas?: Canvas;

  constructor() {

    BaseFabricObject.ownDefaults.originX = 'center'
    BaseFabricObject.ownDefaults.originY = 'center'

    this.c1 = this.createCircle(this.d1().x, this.d1().y, true);
    this.c2 = this.createCircle(this.d2().x, this.d2().y, true);
    this.c3 = this.createCircle(this.d3().x, this.d3().y, true);
    this.c4 = this.createCircle(this.d4().x, this.d4().y, true);

    for (let x = -outputSize; x <= outputSize*2; x += 40) {
      for (let y = -outputSize; y <= outputSize*2; y += 40) {
        this.inputs.push(new Point(outputLeft + x, outputTop + y))
      }
    }

    for (let i = 0; i < this.inputs.length; i++) {
      this.outputCircles.push(this.createCircle(1, 1, false))
    }

    effect(() => {
      for (let i = 0; i < this.outputs().length; i++) {
        this.outputCircles[i].setXY(this.outputs()[i])
      }
    });


    this.updateTransform()

    effect(() => {
      setTimeout(() => {
        if (this.canvas !== undefined) {
          this.canvas.dispose().then(value => {
            this.canvas = this.createCanvas(this.fabricSurface().nativeElement)
          })
        } else {
          this.canvas = this.createCanvas(this.fabricSurface().nativeElement)
        }
      }, 100);
    })
  }

  private createCanvas(el: HTMLCanvasElement): Canvas {

    const canvas = new Canvas(el, {
      backgroundColor: '#ebebef',
      selection: true,
      preserveObjectStacking: true,
    });

    for (let i = 0; i < this.outputs().length; i++) {
      this.outputCircles[i].setXY(new Point(1,1))
      canvas.add(this.outputCircles[i])
      this.outputCircles[i].setXY(this.outputs()[i])
    }

    canvas.add(this.c1);
    canvas.add(this.c2);
    canvas.add(this.c3);
    canvas.add(this.c4);
    this.c1.on("moving", (_) => this.updateTransform());
    this.c2.on("moving", (_) => this.updateTransform());
    this.c3.on("moving", (_) => this.updateTransform());
    this.c4.on("moving", (_) => this.updateTransform());


    return canvas

  }

  createCircle(x:number, y:number, handle: boolean) : Circle {
    return new Circle({
      left: x,
      top: y,
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

    this.d1.set(this.c1.getXY())
    this.d2.set(this.c2.getXY())
    this.d3.set(this.c3.getXY())
    this.d4.set(this.c4.getXY())

    const tm = findHomography(
      [this.s1(), this.s2(), this.s3(), this.s4()],
      [this.d1(), this.d2(), this.d3(), this.d4()],
    )

    this.transform.set(tm)
  }

}
