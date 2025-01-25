import {
  AfterViewInit,
  Component,
  computed, DoCheck,
  effect,
  ElementRef,
  inject, input,
  NgZone,
  signal,
  ViewChild
} from '@angular/core';
import {BaseFabricObject, Canvas, Circle, Point} from 'fabric';
import {DecimalPipe} from '@angular/common';
import {HomographyFinderService} from '../service/homography-finder.service';

const top = 100;
const left = 200;
const size = 400;

@Component({
  selector: 'app-canvas',
  imports: [
    DecimalPipe
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})
export class CanvasComponent implements AfterViewInit {
  private zone = inject(NgZone)
  private homographyFinderService = inject(HomographyFinderService)

  @ViewChild('fabricSurface', {static: false}) fabricSurface!: ElementRef<HTMLCanvasElement>;

  s1 = signal<Point>(new Point(left, top));
  s2 = signal<Point>(new Point(left+size, top));
  s3 = signal<Point>(new Point(left+size, top+size));
  s4 = signal<Point>(new Point(left, top+size));

  d1 = signal<Point>(this.s1().clone());
  d2 = signal<Point>(this.s2().clone());
  d3 = signal<Point>(this.s3().clone());
  d4 = signal<Point>(this.s4().clone());


  homography = computed(() => {
    return this.homographyFinderService.findHomography(
      [this.s1(), this.s2(), this.s3(), this.s4()],
      [this.d1(), this.d2(), this.d3(), this.d4()]
    )
  });

  inputs : Point[] = []

  outputs = computed(() => {
    return this.inputs.map((input) => {
      const [x, y] = [input.x, input.y]
      const h = this.homography()
      const d = h[2][0] * x + h[2][1] * y + h[2][2]
      return new Point(
        (h[0][0] * x + h[0][1] * y + h[0][2]) / d,
        (h[1][0] * x + h[1][1] * y + h[1][2]) / d
      )
    })
  });

  c1: Circle
  c2: Circle
  c3: Circle
  c4: Circle

  outputCircles: Circle[] = []

  protected canvas?: Canvas;

  constructor() {
    BaseFabricObject.ownDefaults.originX = 'center'
    BaseFabricObject.ownDefaults.originY = 'center'

    this.c1 = this.createCircle(this.d1().x, this.d1().y, 20, false);
    this.c1.on("moving", (_) => this.d1.set(this.c1.getXY()));
    this.c2 = this.createCircle(this.d2().x, this.d2().y, 20, false);
    this.c2.on("moving", (_) => this.d2.set(this.c2.getXY()));
    this.c3 = this.createCircle(this.d3().x, this.d3().y, 20, false );
    this.c3.on("moving", (_) => this.d3.set(this.c3.getXY()));
    this.c4 = this.createCircle(this.d4().x, this.d4().y, 20, false);
    this.c4.on("moving", (_) => this.d4.set(this.c4.getXY()));

    for (let x = 0; x <= size; x+=(size/10)) {
      for (let y = 0; y <= size; y+=(size/10)) {
        this.inputs.push(new Point(left+x, top+y))
      }
    }

    this.outputs().length
    for (let i = 0; i < this.outputs().length; i++) {
      this.outputCircles.push(this.createCircle(1,1, 1, true))
    }

    effect(() => {
      for (let i = 0; i < this.outputs().length; i++) {
        this.outputCircles[i].setXY(this.outputs()[i])
      }
    });

  }

  public ngAfterViewInit(): void {

    this.canvas = new Canvas(this.fabricSurface.nativeElement, {
      backgroundColor: '#ebebef',
      selection: true,
      preserveObjectStacking: true,
    });

    this.canvas.add(this.c1);
    this.canvas.add(this.c2);
    this.canvas.add(this.c3);
    this.canvas.add(this.c4);
    for (let i = 0; i < this.outputs().length; i++) {
      this.canvas.add(this.outputCircles[i])
    }

  }

  createCircle(x:number, y:number, radius: number, filled: boolean) : Circle {
    return new Circle({
      left: x,
      top: y,
      stroke: "#000000",
      fill: filled ? "#000000" : "transparent",
      radius: radius,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false
    })
  }

}
