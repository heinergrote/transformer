import {
  AfterViewInit,
  Component, computed, effect,
  ElementRef,
  signal, viewChild,
} from '@angular/core';
import {DecimalPipe, NgStyle} from '@angular/common';
import {
  findHomographyMatrix,
  TransformMatrix,
  TransformType
} from '../util/homography';
import {Application, FederatedPointerEvent, Graphics, Point} from 'pixi.js';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';


@Component({
  selector: 'app-transformer',
  imports: [
    DecimalPipe,
    NgStyle,
    ReactiveFormsModule,
  ],
  templateUrl: './transformer.component.html',
  styleUrl: './transformer.component.css'
})
export class TransformerComponent implements AfterViewInit {

  pixiContainer = viewChild.required<ElementRef<HTMLDivElement>>('pixiContainer')
  pixieApp : Application | undefined;
  dragTarget : any;

  transformType = signal<TransformType>("perspective")
  types: TransformType[] = ["perspective", "affine", "partialAffine"];

  srcPoints = signal<Point[]>([])
  destPoints = signal<Point[]>([])
  destCircles: Graphics[] = []
  srcCircles: Graphics[] = []

  transform = computed(() => {
    return findHomographyMatrix(this.transformType(), this.srcPoints(), this.destPoints())
  })

  inputs: Point[] = []

  outputDots: Graphics[] = []

  matrix3d = computed(() =>
    this.transform().a + ',' + this.transform().d + ',0,' + this.transform().g + ',' +
    this.transform().b + ',' + this.transform().e + ',0,' + this.transform().h + ',' +
    '0,0,1,0,' +
    this.transform().c + ',' + this.transform().f + ',0,' + this.transform().i)

  svgTransform = computed(() => "matrix(" +
    this.transform().a + " " + this.transform().d + " " + this.transform().b + " " +
    this.transform().e + " " + this.transform().c + " " + this.transform().f + ")")

  srcPointsForm: FormGroup;

  constructor() {

    this.srcPointsForm = new FormGroup({
      p1x: new FormControl(0),
      p1y: new FormControl(0),
      p2x: new FormControl(0),
      p2y: new FormControl(0),
      p3x: new FormControl(0),
      p3y: new FormControl(0),
      p4x: new FormControl(0),
      p4y: new FormControl(0),
    });

    this.srcPointsForm.valueChanges.subscribe(() => {
      const newPoints = this.srcPoints().map((_, i) =>
        new Point(this.srcPointsForm.get('p'+(i+1)+'x')?.value, this.srcPointsForm.get('p'+(i+1)+'y')?.value)
      );
      this.srcPoints.set(newPoints)
    })

    // update the dest circles when the points change
    effect(() => {
      this.destPoints().forEach((point, index) => {
        const circle = this.destCircles[index]
        if (circle.x !== point.x || circle.y !== point.x)
          circle.position.set(point.x, point.y)
      });
    })

    // update the src circles when the points change
    effect(() => {
      this.srcPoints().forEach((point, index) => {
        const circle = this.srcCircles[index]
        if (circle.x !== point.x || circle.y !== point.x)
          circle.position.set(point.x, point.y)

        this.srcPointsForm.controls['p'+ (index+1) + 'x'].setValue(point.x, {emitEvent: false})
        this.srcPointsForm.controls['p'+ (index+1) + 'y'].setValue(point.y, {emitEvent: false})
      });

    })

    // render the display when the transformationMatrix changes
    effect(() => {
      this.renderTransformation(this.transform())
    });

  }

  ngAfterViewInit(): void {
    this.initApp().then(app => {
      this.pixieApp = app;
      console.log(app)
      this.initTransform(this.transformType())
    })
  }

  async initApp() {
    const app = new Application();
    await app.init({ background: "#e5e7eb", width: 400, height: 400, antialias: true});
    this.pixiContainer().nativeElement.appendChild(app.canvas);
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointerup', this.onDragEnd);
    app.stage.on('pointerupoutside', this.onDragEnd);
    return app
  }

  initTransform(type:TransformType) {
    const outputPadding = 400;
    const outputSize = 400;
    const outputStep = 20;

    this.inputs = []
    for (let x = -outputPadding; x <= outputSize + outputPadding; x += outputStep) {
      for (let y = -outputPadding; y <= outputSize + outputPadding; y += outputStep) {
        this.inputs.push(new Point(x, y))
      }
    }

    this.initSrcPoints(type)
    this.destPoints.set(this.srcPoints().slice())

    const pixieApp = this.pixieApp
    if (pixieApp) {
      pixieApp.stage.removeChildren()

      // add output "lattice" (all at pos 1,1, because fabric seems to have a bug with negative coordinates)
      this.outputDots = this.inputs.map(
        (_) => {
          return pixieApp.stage.addChild(new Graphics().circle(0, 0, 2).fill(0x000000));
        }
      )

      this.srcCircles = this.srcPoints().map(
        (_) => {
          const circle = this.makeCross(1,1)
          pixieApp.stage.addChild(circle)
          return circle
        }
      )

      this.destCircles = this.destPoints().map(
        (_) => {
          const circle = this.makeHandle(1,1)
          pixieApp.stage.addChild(circle)
          return circle
        }
      )

    }

  }

  initSrcPoints(type: TransformType) {

    const anchorsPadding = 0
    const anchorsSize = 400

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

  }

  makeHandle(x: number, y: number) {
    const handle = new Graphics().circle(0, 0, 10).fill(0xFF0000).stroke(0x000000);
    handle.alpha = 0.5
    handle.position.set(x, y);
    handle.eventMode = 'dynamic';
    handle.cursor = 'pointer';
    handle.on('pointerdown', this.onPointerDown)
    return handle
  }

  makeCross(x: number, y: number) {
    const cross = new Graphics()
      .moveTo(-10, 0).lineTo(-2,0)
      .moveTo(2, 0).lineTo(10,0)
      .moveTo(0, -10).lineTo(0,-2)
      .moveTo(0, 2).lineTo(0,10)
      .circle(0,0, 16)
      .fill({color: 0xFF0000, alpha: 0})
      .stroke(0x000000);
    cross.position.set(x, y);
    cross.position.set(x, y);
    cross.eventMode = 'dynamic';
    cross.cursor = 'pointer';
    cross.on('pointerdown', this.onPointerDown)
    return cross
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
      this.outputDots[index].position.set(point.x, point.y)
    })
  }

  onTransformType(type: TransformType) {
    this.transformType.set(type)
    this.initTransform(this.transformType())
  }

  onPointerDown = (event: FederatedPointerEvent) => {
    this.dragTarget = event.target;
    this.pixieApp!.stage.on('pointermove', this.onDragMove)
  }

  onDragMove= (event: FederatedPointerEvent) => {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);
      this.srcPoints.set(
        this.srcCircles.map((circle) => {
          return new Point(Math.round(circle.position.x), Math.round(circle.position.y))
        })
      )
      this.destPoints.set(
        this.destCircles.map((circle) => {
          return new Point(Math.round(circle.position.x), Math.round(circle.position.y))
        })
      )
    }
  }

  onDragEnd = (_: FederatedPointerEvent)=> {
    if (this.dragTarget) {
      this.pixieApp!.stage.off('pointermove', this.onDragMove);
      this.dragTarget = null;
    }
  }

}


